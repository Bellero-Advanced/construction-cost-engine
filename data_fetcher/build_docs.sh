#!/usr/bin/env bash
# ============================================================================
#  build_docs.sh — คอมไพล์เอกสารอธิบาย src เป็น PDF + DOCX จาก LaTeX
# ============================================================================
#  ใช้:  ./build_docs.sh
#
#  ต้องมี:
#    - xelatex  (ติดตั้งผ่าน TinyTeX / MacTeX / TeX Live)
#    - pandoc   (brew install pandoc)
#    - ฟอนต์ Sarabun ในโฟลเดอร์ fonts/ (มีให้แล้ว)
# ============================================================================
set -e

TEX="data-fetcher-explained.tex"
BASE="data-fetcher-explained"

# หา xelatex (TinyTeX อยู่ใน ~/Library/TinyTeX)
export PATH="$PATH:$HOME/Library/TinyTeX/bin/universal-darwin"

cd "$(dirname "$0")"

echo "============================================"
echo "  1/3  คอมไพล์ PDF (xelatex x2)"
echo "============================================"
xelatex -interaction=nonstopmode "$TEX" > /dev/null
xelatex -interaction=nonstopmode "$TEX" > /dev/null
echo "  [OK] $BASE.pdf"

echo "============================================"
echo "  2/3  สร้าง source ที่ pandoc อ่านได้"
echo "============================================"
# แปลง custom command/environment ให้ pandoc เข้าใจ
python3 - << 'PYEOF'
import re
src = open('data-fetcher-explained.tex', encoding='utf-8').read()
# \barsection -> \section
src = re.sub(r'\\barsection\{', r'\\section{', src)
src = re.sub(r'% ── คำสั่งช่วย.*?\\addcontentsline\{toc\}\{section\}\{#1\}%\s*\}', '', src, flags=re.S)
# tcolorbox custom envs -> quote
def infobox_repl(m):
    return r'\begin{quote}\textbf{' + m.group(1) + r'}\par ' + m.group(2) + r'\end{quote}'
src = re.sub(r'\\begin\{infobox\}\{(.*?)\}(.*?)\\end\{infobox\}', infobox_repl, src, flags=re.S)
src = re.sub(r'\\begin\{tipbox\}(.*?)\\end\{tipbox\}', r'\\begin{quote}\1\\end{quote}', src, flags=re.S)
# math arrows -> plain text (pandoc math reader chokes on \big\downarrow)
src = src.replace(r'$\big\downarrow$', '↓')
src = re.sub(r'\\begin\{tcolorbox\}\[.*?\]', r'\\begin{quote}', src)
src = re.sub(r'\\end\{tcolorbox\}', r'\\end{quote}', src)
open('_docx_src.tex', 'w', encoding='utf-8').write(src)
print("  [OK] _docx_src.tex")
PYEOF

echo "============================================"
echo "  3/3  แปลงเป็น DOCX (pandoc)"
echo "============================================"
pandoc _docx_src.tex --from=latex --to=docx \
  --output="$BASE.docx" --standalone --toc
echo "  [OK] $BASE.docx"

# เก็บกวาดไฟล์ชั่วคราว
rm -f _docx_src.tex "$BASE.aux" "$BASE.log" "$BASE.out" "$BASE.toc"

echo ""
echo "============================================"
echo "  เสร็จสิ้น — ได้ไฟล์:"
echo "    • $BASE.pdf"
echo "    • $BASE.docx"
echo "============================================"
