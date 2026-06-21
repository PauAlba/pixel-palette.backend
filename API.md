# API Reference & Curl Examples

Set these variables in your terminal to use the examples below:
```bash
BASE_URL="http://localhost:3000/api"
TOKEN="<your_jwt_token_here>"
```

## System

### Health Check
```bash
curl $BASE_URL/health
```

## Auth

### Signup
```bash
curl -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "password":"Password123!", "username":"pixel_user", "display_name":"Pixel User"}'
```

### Login
```bash
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com", "password":"Password123!"}'
```

### Refresh Token
```bash
curl -X POST $BASE_URL/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<your_refresh_token_here>"}'
```

### Get Current User (Me)
```bash
curl $BASE_URL/auth/me -H "Authorization: Bearer $TOKEN"
```

## Profiles

### Get Top Profiles
```bash
curl "$BASE_URL/profiles/top?limit=4"
```

### Get Profile
```bash
curl $BASE_URL/profiles/pixel_user
```

### Update Profile
```bash
curl -X PATCH $BASE_URL/profiles/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio":"I love pixel art!", "mood":"happy", "favorite_artists":["art1"]}'
```

### Get Profile Posts
```bash
curl "$BASE_URL/profiles/pixel_user/posts?page=1&limit=10"
```

### Get Profile Followers
```bash
curl "$BASE_URL/profiles/pixel_user/followers?page=1&limit=10"
```

### Get Profile Following
```bash
curl "$BASE_URL/profiles/pixel_user/following?page=1&limit=10"
```

## Followers

### Follow a User
```bash
curl -X POST $BASE_URL/followers/pixel_user \
  -H "Authorization: Bearer $TOKEN"
```

### Unfollow a User
```bash
curl -X DELETE $BASE_URL/followers/pixel_user \
  -H "Authorization: Bearer $TOKEN"
```

## Posts

### Get Feed
```bash
curl "$BASE_URL/posts?page=1&limit=10"
```

### Get Post Details
```bash
curl $BASE_URL/posts/<post_id>
```

### Create Post
```bash
curl -X POST $BASE_URL/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Art", "content":"Look at this", "post_type":"image", "cover_image_url":"https://example.com/img.png"}'
```

### Update Post
```bash
curl -X PATCH $BASE_URL/posts/<post_id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title", "content":"Updated content"}'
```

### Delete Post
```bash
curl -X DELETE $BASE_URL/posts/<post_id> \
  -H "Authorization: Bearer $TOKEN"
```

### Like a Post
```bash
curl -X POST $BASE_URL/posts/<post_id>/like -H "Authorization: Bearer $TOKEN"
```

### Unlike a Post
```bash
curl -X DELETE $BASE_URL/posts/<post_id>/like -H "Authorization: Bearer $TOKEN"
```

## Comments

### Get Comments on Post
```bash
curl "$BASE_URL/posts/<post_id>/comments?page=1&limit=10"
```

### Comment on Post
```bash
curl -X POST $BASE_URL/posts/<post_id>/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Awesome work!"}'
```

### Delete Comment
```bash
curl -X DELETE $BASE_URL/comments/<comment_id> \
  -H "Authorization: Bearer $TOKEN"
```

## Notifications

### List Notifications
```bash
curl "$BASE_URL/notifications?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### List Unread Count
```bash
curl $BASE_URL/notifications/unread-count -H "Authorization: Bearer $TOKEN"
```

### Mark One as Read
```bash
curl -X PATCH $BASE_URL/notifications/<notification_id>/read \
  -H "Authorization: Bearer $TOKEN"
```

### Mark All Read
```bash
curl -X PATCH $BASE_URL/notifications/read-all -H "Authorization: Bearer $TOKEN"
```

## Themes & Guestbook

### Get User Theme
```bash
curl $BASE_URL/themes/pixel_user
```

### Update Theme
```bash
curl -X PUT $BASE_URL/themes/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customCss":"body { background: #000; }", "backgroundPattern":"grid"}'
```

### Get Guestbook Signatures
```bash
curl "$BASE_URL/guestbook/pixel_user?page=1&limit=10"
```

### Sign Guestbook
```bash
curl -X POST $BASE_URL/guestbook/pixel_user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Cool profile!"}'
```

### Delete Guestbook Signature
```bash
curl -X DELETE $BASE_URL/guestbook/<guestbook_id> \
  -H "Authorization: Bearer $TOKEN"
```
