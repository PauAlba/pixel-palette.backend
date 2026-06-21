# API Reference & Curl Examples

Set these variables in your terminal to use the examples below:
```bash
BASE_URL="http://localhost:3000/api"
TOKEN="<your_jwt_token_here>"
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

### Get Current User (Me)
```bash
curl $BASE_URL/auth/me -H "Authorization: Bearer $TOKEN"
```

## Profiles

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

## Posts

### Get Feed
```bash
curl "$BASE_URL/posts?page=1&limit=10"
```

### Create Post
```bash
curl -X POST $BASE_URL/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Art", "content":"Look at this", "post_type":"image", "cover_image_url":"https://example.com/img.png"}'
```

### Like a Post
```bash
curl -X POST $BASE_URL/posts/<post_id>/like -H "Authorization: Bearer $TOKEN"
```

## Comments

### Comment on Post
```bash
curl -X POST $BASE_URL/posts/<post_id>/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Awesome work!"}'
```

## Notifications

### List Unread Count
```bash
curl $BASE_URL/notifications/unread-count -H "Authorization: Bearer $TOKEN"
```

### Mark All Read
```bash
curl -X PATCH $BASE_URL/notifications/read-all -H "Authorization: Bearer $TOKEN"
```

## Themes & Guestbook

### Update Theme
```bash
curl -X PUT $BASE_URL/themes/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customCss":"body { background: #000; }", "backgroundPattern":"grid"}'
```

### Sign Guestbook
```bash
curl -X POST $BASE_URL/guestbook/pixel_user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Cool profile!"}'
```
