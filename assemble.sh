#!/bin/bash
# Assemble the prototype from parts
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$DIR/prototype.html"

cat > "$OUT" << 'HEAD'
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hotel Management Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="brand.config.js"></script>
  <style>
HEAD

# Append CSS
cat "$DIR/parts/01-css.css" >> "$OUT"

# Append Apple-style theme layer (loaded last so it wins the cascade)
cat "$DIR/parts/04-apple-theme.css" >> "$OUT"

cat >> "$OUT" << 'MIDSTYLE'
  </style>
</head>
<body>
MIDSTYLE

# Append HTML body content
cat "$DIR/parts/02-html.html" >> "$OUT"

cat >> "$OUT" << 'MIDSCRIPT'

  <script>
MIDSCRIPT

# Append JavaScript
cat "$DIR/parts/03-js.js" >> "$OUT"

cat >> "$OUT" << 'TAIL'
  </script>
</body>
</html>
TAIL

# Also sync index.html so root URL / works automatically
cp "$OUT" "$DIR/index.html"

echo "Assembly complete! Lines: $(wc -l < "$OUT")"
