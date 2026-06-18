<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $title ?? "IT Helpdesk" }}</title>
  <style>
    body { margin: 0; padding: 0; background: #F5F7F8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 20px 10px; }
    .header { background: #1F6EB0; border-radius: 8px 8px 0 0; padding: 24px 30px; text-align: center; }
    .header h1 { color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 600; }
    .body { background: #FFFFFF; padding: 30px; border-left: 1px solid #E6E9EC; border-right: 1px solid #E6E9EC; }
    .footer { background: #F5F7F8; border-radius: 0 0 8px 8px; padding: 16px 30px; text-align: center; font-size: 12px; color: #828B95; border: 1px solid #E6E9EC; border-top: none; }
    .btn { display: inline-block; background: #1F6EB0; color: #FFFFFF !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 500; margin: 16px 0; }
    .ticket-id { font-size: 12px; color: #828B95; font-family: monospace; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>{{ $title ?? "IT Helpdesk" }}</h1></div>
    <div class="body">{{ $slot }}</div>
    <div class="footer">&copy; {{ date("Y") }} IT Helpdesk</div>
  </div>
</body>
</html>