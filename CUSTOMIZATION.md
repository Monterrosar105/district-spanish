# District Spanish - Customization Quick Reference

Quick guide to customize the website for your needs.

---

## 📝 Text Content Changes

### Company Email
**File:** `index.html`  
**Find and Replace:**
```
team@districtspanish.com  →  your-email@yourdomain.com
```
**Locations (all must be updated):**
1. Contact section (Line ~535)
2. Contact form section (Line ~600+)
3. Footer link (Line ~620+)

### WhatsApp Number
**File:** `index.html`  
**Find and Replace:**
```
https://wa.me/14155552671  →  https://wa.me/[COUNTRY_CODE][PHONE_NUMBER]
```
**Format:** Country code + phone (no spaces or dashes)
- USA: `+1` = `1`
- UK: `+44` = `44`
- Canada: `+1` = `1`
- Mexico: `+52` = `52`
- Spain: `+34` = `34`
- Colombia: `+57` = `57`

**Example: Mexico phone 5551234567 with country code +52:**
```
https://wa.me/525551234567?text=Hi...
```

### Company Name
**File:** `index.html`  
**Find and Replace:**
```
District Spanish  →  Your Company Name
```
**Locations:**
- Navbar logo text (Line ~41)
- Footer (Line ~615)

### Teacher Information
**File:** `index.html`

**Teacher 1 (María):**
```html
<h3>María</h3>
<p class="teacher-country">🇨🇴 Colombia</p>
<p class="teacher-specialty">Conversation Specialist</p>
<p class="teacher-tagline">Vamos a conversar sin miedo</p>
```
Edit: Name, country/flag, specialty, Spanish tagline

Repeat for Teacher 2, 3, 4, 5 in their respective cards.

### Pricing Plans
**File:** `index.html` (Lines ~470-530)

**Basic Plan:**
```html
<div class="pricing-price">$29<span>/month</span></div>
<ul class="pricing-features">
    <li>✓ 4 group classes per week</li>
    <!-- Edit these lines -->
</ul>
```

Repeat for Pro and Premium plans.

### Programs
**File:** `index.html` (Lines ~150-200)

**Beginner Program:**
```html
<h3>Beginner Spanish</h3>
<p class="program-accent">Paso a paso, sin miedo</p>
<p class="program-description">Your description here...</p>
```

Repeat for other programs.

---

## 🎨 Color Changes

### Change All Primary Color (Orange)
**File:** `css/style.css`  
**Find and Replace:**
```css
--primary-color: #f69521;  →  --primary-color: #YOUR_HEX_CODE;
```

Common color alternatives:
- Red: `#e74c3c`
- Green: `#27ae60`
- Purple: `#8e44ad`
- Blue: `#3498db`
- Teal: `#1abc9c`

### Change Secondary Color (Blue)
**File:** `css/style.css`  
**Find and Replace:**
```css
--secondary-color: #1e6294;  →  --secondary-color: #YOUR_HEX_CODE;
```

### Change Background Color
**File:** `css/style.css`  
**Find and Replace:**
```css
--light-bg: #f8f9fa;  →  --light-bg: #YOUR_HEX_CODE;
```

---

## 📸 Image Updates

### Logo
**Replace:** `images/logo.svg`
- Current: SVG placeholder
- Recommended: 200x200px PNG or SVG
- Keep aspect ratio square or wide
- Transparent background preferred

### Favicon
**Replace:** `images/logo-tab.svg`
- Current: SVG placeholder  
- Recommended: 32x32px PNG or favicon.ico
- Should match your brand
- Simple design (scales to tiny size)

### Teacher Photos
**Replace files in:** `images/teachers/`
- `teacher1.svg` → `teacher1.jpg`
- `teacher2.svg` → `teacher2.jpg`
- `teacher3.svg` → `teacher3.jpg`
- `teacher4.svg` → `teacher4.jpg`
- `teacher5.svg` → `teacher5.jpg`

**Requirements:**
- Format: JPG or PNG
- Size: 300x300px (square)
- File size: < 100KB each
- Professional headshots
- Good lighting

**Note:** If using JPG, update HTML:
```html
<!-- Change from: -->
<img src="./images/teachers/teacher1.svg" alt="...">
<!-- To: -->
<img src="./images/teachers/teacher1.jpg" alt="...">
```

---

## 🔤 Typography Changes

### Change Main Font
**File:** `css/style.css`
**Line 1-5:** Currently uses "Poppins" from Google Fonts

To change:
1. Go to [fonts.google.com](https://fonts.google.com)
2. Find a Google Font you like
3. Copy the `<link>` tag
4. Replace in `index.html` `<head>` section
5. Update font-family in CSS:
```css
body {
    font-family: 'Your Font Name', sans-serif;
}
```

Popular alternatives:
- Inter (modern, clean)
- Roboto (versatile)
- Open Sans (readable)
- Montserrat (bold)
- Ubuntu (friendly)

### Change Heading Size
**File:** `css/style.css` (Lines ~100-120)

Currently:
```css
h1 { font-size: 3rem; }
h2 { font-size: 2.5rem; }
h3 { font-size: 1.5rem; }
```

Make larger/smaller by adjusting `rem` values.

---

## 🎯 Content Section Updates

### Hero Section
**File:** `index.html` (Lines ~46-60)
```html
<h1 class="hero-title">Speak Spanish with Confidence</h1>
<p class="hero-subtitle">Live classes with native teachers...</p>
<p class="hero-accent">Tu nueva vida empieza en español.</p>
```

### Problem/Solution Section
**File:** `index.html` (Lines ~65-105)
- Edit pain points (left side)
- Edit solutions (right side)
- Update accent line

### Programs Section
**File:** `index.html` (Lines ~110-160)
- Update program titles
- Update descriptions
- Update Spanish accents

### Testimonials
**File:** `index.html` (Lines ~270-310)
```html
<p>"I went from zero to conversations in 2 months..."</p>
<p class="testimonial-spanish">Ahora puedo hablar con confianza.</p>
<p><strong>Sarah M.</strong> • USA</p>
```

### FAQ
**File:** `index.html` (Lines ~550-630)
```html
<button class="faq-question">
    <span>Your question here?</span>
    <span class="faq-icon">+</span>
</button>
<div class="faq-answer">
    <p>Your answer here...</p>
</div>
```

---

## 🔧 Advanced Customizations

### Add New Section
1. Create HTML in `index.html`
2. Give it a unique `id` for navigation
3. Add CSS styling in `style.css`
4. Follow existing layout patterns (use Flexbox/Grid)
5. Test responsiveness

### Change Button Appearance
**File:** `css/style.css` (Lines ~60-130)

Currently 60px tall with orange background.

To modify:
```css
.btn {
    padding: 12px 28px;  /* Change vertical/horizontal padding */
    border-radius: 8px;   /* Change corner roundness */
    font-size: 1rem;      /* Change text size */
}
```

### Modify Responsive Breakpoints
**File:** `css/style.css`

Current breakpoint: `768px` (for tablets)

To change tablet breakpoint:
1. Find all `@media (max-width: 768px)`
2. Replace `768px` with your value
3. Adjust CSS for that breakpoint

---

## 📱 Mobile Customizations

### Hamburger Menu Color
**File:** `css/style.css` (Lines ~250-270)
```css
.hamburger span {
    background-color: var(--dark-text);  /* Change this color */
}
```

### Mobile Padding
**File:** `css/style.css`

All sections have padding adjustments for mobile.
Find `@media (max-width: 768px)` blocks and adjust padding values.

### WhatsApp Button Position
**File:** `css/style.css` (Lines ~880-910)
```css
.whatsapp-button {
    bottom: 30px;  /* Distance from bottom */
    right: 30px;   /* Distance from right */
    width: 60px;   /* Button diameter */
}
```

For mobile changes:
```css
@media (max-width: 768px) {
    .whatsapp-button {
        width: 55px;
        bottom: 20px;  /* Adjust for mobile */
        right: 20px;
    }
}
```

---

## 🎯 SEO Keywords

### Update Meta Description
**File:** `index.html` (Line 6)
```html
<meta name="description" content="Learn Spanish online...">
```

Keep under 160 characters. Include:
- Main keyword: "Learn Spanish"
- Main benefit: "native teachers"
- CTA: "Start today"

### Add More Keywords
1. Research keywords at [ahrefs.com](https://ahrefs.com) or [semrush.com](https://semrush.com)
2. Add naturally in:
   - Page title
   - Meta description
   - Headings
   - Body content

---

## 📧 Email Integration

### Contact Form Email (Currently Uses mailto)

**For production, replace with:**

**Option 1: FormSubmit (Easiest)**
```html
<form action="https://formsubmit.co/your@email.com" method="POST">
```

**Option 2: Formspree**
1. Go to [formspree.io](https://formspree.io)
2. Create account
3. Get form endpoint
4. Update form action

**Option 3: Basin**
1. Go to [usebasin.com](https://usebasin.com)
2. Create form
3. Copy form ID
4. Update form attributes

---

## 🔗 Managing Links

### Update All Navigation Links
All anchor links start with `#`:
```html
<a href="#programs">Programs</a>  <!-- Links to #programs section -->
<a href="#contact">Contact</a>    <!-- Links to #contact section -->
```

Section IDs must match:
```html
<section id="programs">...</section>
<section id="contact">...</section>
```

### External Links
For external websites:
```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
```

---

## 💾 Save & Test

After making changes:
1. **Save all files** (Ctrl+S)
2. **Refresh browser** (F5 or Ctrl+R)
3. **Clear cache** if changes don't appear (Ctrl+Shift+Delete)
4. **Test on mobile** (Chrome DevTools: F12 → Toggle device toolbar)
5. **Check console** for JavaScript errors (F12 → Console)

---

## 🐛 Common Mistakes

### ❌ Broken Links
- Site links: Use `#section-id`
- External: Use full URL with `https://`
- Don't forget trailing slashes

### ❌ Image Paths Wrong
Current structure:
```
images/logo.svg
images/logo-tab.svg
images/teachers/teacher1.svg
```

Use relative paths: `./images/logo.svg`

### ❌ Color Values Invalid
Use proper hex format: `#f69521` (not `f69521` or `FF69521`)

### ❌ Font Not Loading
- Check Google Fonts link in `<head>`
- Ensure font name matches CSS
- Check for typos in font names

---

## ✅ Checklist After Customization

- [ ] All text updated
- [ ] All images replaced
- [ ] Colors updated
- [ ] Links working
- [ ] Mobile tested
- [ ] No broken images
- [ ] No console errors
- [ ] Form email working
- [ ] Navigation smooth
- [ ] Font loading correctly

---

**Need Help?**
- Check the main [README.md](README.md)
- See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting
- Check code comments in HTML/CSS/JS files

Good luck with your customizations! 🚀
