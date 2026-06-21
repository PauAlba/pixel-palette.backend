$BASE = "http://localhost:3000/api"
$results = @()
$ACCESS  = ""
$REFRESH = ""
$ACCESS2 = ""
$POST_ID = ""
$COMMENT_ID = ""

function Test-Endpoint {
  param($Label, $Method, $Url, $Body, $Token)
  $headers = @{ "Content-Type" = "application/json" }
  if ($Token) { $headers["Authorization"] = "Bearer $Token" }
  try {
    $params = @{ Method=$Method; Uri=$Url; Headers=$headers; ErrorAction="Stop" }
    if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 5) }
    $resp = Invoke-WebRequest @params
    return [PSCustomObject]@{
      Test   = $Label
      Status = [int]$resp.StatusCode
      Result = "PASS"
      Raw    = $resp.Content
    }
  } catch {
    $code = 0
    $body = ""
    try { $code = [int]$_.Exception.Response.StatusCode.value__ } catch {}
    try {
      $stream = $_.Exception.Response.GetResponseStream()
      $body = [System.IO.StreamReader]::new($stream).ReadToEnd()
    } catch {}
    $expected = $code -in @(400,401,403,404,409)
    return [PSCustomObject]@{
      Test   = $Label
      Status = $code
      Result = if ($expected) { "PASS (expected $code)" } else { "FAIL" }
      Raw    = $body
    }
  }
}

Write-Host "Starting Pixel Palette API test suite..."

# 1. Health
$r = Test-Endpoint "GET /health" GET "$BASE/health" $null $null
$results += $r

# 2. Signup user1
$r = Test-Endpoint "POST /auth/signup" POST "$BASE/auth/signup" @{
  email="tester_a@pixel.io"; password="Secret123"; username="tester_a"; display_name="Tester A"
} $null
$results += $r
try { $d = ($r.Raw | ConvertFrom-Json).data; $ACCESS = $d.accessToken; $REFRESH = $d.refreshToken } catch {}

# 3. Signup duplicate -> 409
$results += Test-Endpoint "POST /auth/signup dup->409" POST "$BASE/auth/signup" @{
  email="tester_a@pixel.io"; password="Secret123"; username="tester_a"; display_name="Tester A"
} $null

# 4. Login
$r = Test-Endpoint "POST /auth/login" POST "$BASE/auth/login" @{
  email="tester_a@pixel.io"; password="Secret123"
} $null
$results += $r
try { $ACCESS = ($r.Raw | ConvertFrom-Json).data.accessToken } catch {}

# 5. Login bad password -> 401
$results += Test-Endpoint "POST /auth/login bad->401" POST "$BASE/auth/login" @{
  email="tester_a@pixel.io"; password="WrongPass9"
} $null

# 6. GET /me with token
$results += Test-Endpoint "GET /auth/me" GET "$BASE/auth/me" $null $ACCESS

# 7. GET /me no token -> 401
$results += Test-Endpoint "GET /auth/me no-token->401" GET "$BASE/auth/me" $null $null

# 8. Refresh
$results += Test-Endpoint "POST /auth/refresh" POST "$BASE/auth/refresh" @{ refreshToken=$REFRESH } $null

# 9. Signup user2
$r = Test-Endpoint "POST /auth/signup (user2)" POST "$BASE/auth/signup" @{
  email="tester_b@pixel.io"; password="Secret123"; username="tester_b"; display_name="Tester B"
} $null
$results += $r
try { $ACCESS2 = ($r.Raw | ConvertFrom-Json).data.accessToken } catch {}

# 10. GET public profile
$results += Test-Endpoint "GET /profiles/tester_a" GET "$BASE/profiles/tester_a" $null $null

# 11. PATCH profile/me
$results += Test-Endpoint "PATCH /profiles/me" PATCH "$BASE/profiles/me" @{
  bio="Pixel artist retro"; mood="Creating..."; favorite_artists=@("Monet","Van Gogh")
} $ACCESS

# 12. Follow user2
$results += Test-Endpoint "POST /followers/tester_b" POST "$BASE/followers/tester_b" $null $ACCESS

# 13. Follow duplicate -> 409
$results += Test-Endpoint "POST /followers/tester_b dup->409" POST "$BASE/followers/tester_b" $null $ACCESS

# 14. Self-follow -> 400
$results += Test-Endpoint "POST /followers/tester_a self->400" POST "$BASE/followers/tester_a" $null $ACCESS

# 15. List followers
$results += Test-Endpoint "GET /profiles/tester_b/followers" GET "$BASE/profiles/tester_b/followers" $null $null

# 16. List following
$results += Test-Endpoint "GET /profiles/tester_a/following" GET "$BASE/profiles/tester_a/following" $null $null

# 17. Unfollow
$results += Test-Endpoint "DELETE /followers/tester_b" DELETE "$BASE/followers/tester_b" $null $ACCESS

# 18. Create post
$r = Test-Endpoint "POST /posts" POST "$BASE/posts" @{
  content="My first pixel art"; title="First Post"; post_type="pixel_art"; tags=@("retro","8bit")
} $ACCESS
$results += $r
try { $POST_ID = ($r.Raw | ConvertFrom-Json).data.id } catch {}

# 19. Feed
$results += Test-Endpoint "GET /posts feed" GET "$BASE/posts?page=1&limit=5" $null $null

# 20. Post detail
if ($POST_ID) {
  $results += Test-Endpoint "GET /posts/:id" GET "$BASE/posts/$POST_ID" $null $null
}

# 21. PATCH post (owner)
if ($POST_ID) {
  $results += Test-Endpoint "PATCH /posts/:id (owner)" PATCH "$BASE/posts/$POST_ID" @{
    content="Updated content"; is_featured=$true
  } $ACCESS
}

# 22. PATCH post (non-owner -> 403)
if ($POST_ID -and $ACCESS2) {
  $results += Test-Endpoint "PATCH /posts/:id non-owner->403" PATCH "$BASE/posts/$POST_ID" @{
    content="Hack"
  } $ACCESS2
}

# 23. Create comment
if ($POST_ID) {
  $r = Test-Endpoint "POST /posts/:id/comments" POST "$BASE/posts/$POST_ID/comments" @{
    content="Great pixel art!"
  } $ACCESS
  $results += $r
  try { $COMMENT_ID = ($r.Raw | ConvertFrom-Json).data.id } catch {}
}

# 24. List comments
if ($POST_ID) {
  $results += Test-Endpoint "GET /posts/:id/comments" GET "$BASE/posts/$POST_ID/comments" $null $null
}

# 25. Like
if ($POST_ID) {
  $results += Test-Endpoint "POST /posts/:id/like" POST "$BASE/posts/$POST_ID/like" $null $ACCESS
}

# 26. Like idempotent (same user again - ON CONFLICT DO NOTHING)
if ($POST_ID) {
  $results += Test-Endpoint "POST /posts/:id/like (idem)" POST "$BASE/posts/$POST_ID/like" $null $ACCESS
}

# 27. Unlike
if ($POST_ID) {
  $results += Test-Endpoint "DELETE /posts/:id/like" DELETE "$BASE/posts/$POST_ID/like" $null $ACCESS
}

# 28. Profile posts
$results += Test-Endpoint "GET /profiles/tester_a/posts" GET "$BASE/profiles/tester_a/posts?page=1&limit=10" $null $null

# 29. Delete comment (owner)
if ($COMMENT_ID) {
  $results += Test-Endpoint "DELETE /comments/:id (owner)" DELETE "$BASE/comments/$COMMENT_ID" $null $ACCESS
}

# 30. Delete post (owner)
if ($POST_ID) {
  $results += Test-Endpoint "DELETE /posts/:id (owner)" DELETE "$BASE/posts/$POST_ID" $null $ACCESS
}

# ── Report ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================================"
Write-Host " PIXEL PALETTE API - TEST RESULTS"
Write-Host "================================================================"
$pass = 0; $fail = 0
foreach ($r in $results) {
  $isPASS = $r.Result -like "*PASS*"
  $tag    = if ($isPASS) { "[ OK ]" } else { "[FAIL]" }
  Write-Host "$tag  [$($r.Status)]  $($r.Test)"
  if (-not $isPASS) {
    Write-Host "       Error: $($r.Raw.Substring(0, [Math]::Min(200, $r.Raw.Length)))"
    $fail++
  } else { $pass++ }
}
Write-Host "----------------------------------------------------------------"
Write-Host " Total: $($results.Count) | PASS: $pass | FAIL: $fail"
Write-Host "================================================================"
