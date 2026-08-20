#!/usr/bin/env python3
"""Builds the EPUB edition of Statistics: A First Course from the HTML chapters."""
import os
import re
from bs4 import BeautifulSoup
from ebooklib import epub

ROOT = "/home/user/web/stats-textbook"
HTML_DIR = os.path.join(ROOT, "html")
IMAGES_DIR = os.path.join(ROOT, "images")
OUT_PATH = os.path.join(ROOT, "epub", "statistics-a-first-course.epub")

CHAPTER_FILES = [
    "ch01-what-is-statistics.html",
    "ch02-data-types-and-collection.html",
    "ch03-central-tendency.html",
    "ch04-variability-and-shape.html",
    "ch05-visualizing-data.html",
    "ch06-normal-distribution.html",
    "ch07-probability-foundations.html",
    "ch08-conditional-probability.html",
    "ch09-random-variables.html",
    "ch10-discrete-distributions.html",
    "ch11-continuous-distributions.html",
    "ch12-central-limit-theorem.html",
    "ch13-sampling-distributions.html",
    "ch14-confidence-intervals.html",
    "ch15-hypothesis-testing.html",
    "ch16-one-two-sample-tests.html",
    "ch17-inference-for-proportions.html",
    "ch18-power-and-sample-size.html",
    "ch19-anova.html",
    "ch20-chi-square-tests.html",
    "ch21-nonparametric-methods.html",
    "ch22-correlation.html",
    "ch23-simple-linear-regression.html",
    "ch24-multiple-regression.html",
    "ch25-regression-diagnostics.html",
    "ch26-time-series.html",
    "ch27-bayesian-statistics.html",
    "ch28-ethics-and-communication.html",
]

PART_TITLES = {
    "Part I": "Part I · Descriptive Statistics & Exploratory Data Analysis",
    "Part II": "Part II · Probability",
    "Part III": "Part III · Statistical Inference",
    "Part IV": "Part IV · Comparing Multiple Groups",
    "Part V": "Part V · Relationships Between Variables",
    "Part VI": "Part VI · Extensions",
}


def read_css():
    with open(os.path.join(HTML_DIR, "styles.css")) as f:
        return f.read()


def html_body_to_xhtml(path, image_items):
    with open(path, encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")
    title = soup.title.string if soup.title else "Untitled"
    title = title.split(" — ")[0].strip()

    # drop the chapternav (prev/next html links) and footer; EPUB reader supplies navigation
    for nav in soup.find_all("nav", class_="chapternav"):
        nav.decompose()
    for foot in soup.find_all("footer", class_="pagefoot"):
        foot.decompose()
    # drop "return to TOC" paragraph links pointing at index.html (handled by EPUB TOC)
    for a in soup.find_all("a", href=True):
        if a["href"].startswith("index.html") and a.parent.name == "p" and len(a.parent.get_text(strip=True)) < 80:
            a.parent.decompose()

    body = soup.body
    # rewrite image paths and register images
    for img in body.find_all("img"):
        src = img["src"]
        fname = os.path.basename(src)
        img["src"] = f"images/{fname}"
        image_items.add(fname)

    inner_html = "".join(str(c) for c in body.contents)
    return title, inner_html


def make_chapter_item(fname, idx, image_items):
    path = os.path.join(HTML_DIR, fname)
    title, inner_html = html_body_to_xhtml(path, image_items)
    slug = fname.replace(".html", "")
    c = epub.EpubHtml(title=title, file_name=f"{slug}.xhtml", lang="en")
    c.content = f"<html xmlns='http://www.w3.org/1999/xhtml'><head><title>{title}</title><link rel='stylesheet' href='style/book.css'/></head><body>{inner_html}</body></html>"
    c.add_link(href="style/book.css", rel="stylesheet", type="text/css")
    return c


def make_cover_page():
    html = """
    <div class="cover">
      <div class="kicker">A University-Level Introduction</div>
      <h1>Statistics: A First Course</h1>
      <div class="subtitle">From Data to Decisions</div>
      <p class="subtitle" style="margin-top:1rem;font-size:0.95rem;">Draft edition &middot; Chapters 1&ndash;7 available in full &middot; Parts II&ndash;VI forthcoming</p>
    </div>
    <h2 style="border-bottom:none;">How to Use This Book</h2>
    <p>This text is designed for a two-semester introductory statistics sequence at the university level.
    Part I builds the descriptive toolkit needed to summarize and visualize data. Part II develops probability
    as the mathematical language of uncertainty. Parts III&ndash;IV cover the core machinery of statistical
    inference: estimation, hypothesis testing, and comparisons across groups. Part V develops regression and
    the study of relationships between variables. Part VI introduces extensions &mdash; time series, Bayesian
    methods, and the ethics of statistical practice.</p>
    <p>Each available chapter includes worked examples, callout boxes for definitions and common pitfalls,
    figures, and end-of-chapter exercises with selected solutions.</p>
    """
    c = epub.EpubHtml(title="Statistics: A First Course", file_name="titlepage.xhtml", lang="en")
    c.content = f"<html xmlns='http://www.w3.org/1999/xhtml'><head><title>Statistics: A First Course</title><link rel='stylesheet' href='style/book.css'/></head><body>{html}</body></html>"
    return c


def main():
    book = epub.EpubBook()
    book.set_identifier("statistics-a-first-course-2026")
    book.set_title("Statistics: A First Course")
    book.set_language("en")
    book.add_author("Draft Edition")
    book.add_metadata("DC", "description", "A university-level introductory statistics textbook. Chapters 1-7 (Part I and the opening of Part II) are complete; remaining chapters are outlined for future editions.")

    css_text = read_css()
    css_item = epub.EpubItem(uid="book_css", file_name="style/book.css", media_type="text/css", content=css_text)
    book.add_item(css_item)

    image_items = set()

    title_page = make_cover_page()
    book.add_item(title_page)

    chapter_items = []
    for i, fname in enumerate(CHAPTER_FILES, start=1):
        item = make_chapter_item(fname, i, image_items)
        book.add_item(item)
        chapter_items.append(item)

    for fname in sorted(image_items):
        path = os.path.join(IMAGES_DIR, fname)
        with open(path, "rb") as f:
            data = f.read()
        img_item = epub.EpubItem(uid=f"img_{fname}", file_name=f"images/{fname}", media_type="image/png", content=data)
        book.add_item(img_item)

    # Build nested TOC by part, based on the kicker text in each source file
    part_map = {}
    part_order = []
    for fname, item in zip(CHAPTER_FILES, chapter_items):
        with open(os.path.join(HTML_DIR, fname), encoding="utf-8") as f:
            soup = BeautifulSoup(f.read(), "html.parser")
        kicker = soup.find("div", class_="kicker")
        text = kicker.get_text() if kicker else ""
        part_key = text.split("·")[0].strip() if "·" in text else "Other"
        full_part = PART_TITLES.get(part_key, part_key)
        part_map.setdefault(full_part, [])
        part_map[full_part].append(item)
        if full_part not in part_order:
            part_order.append(full_part)

    toc = [epub.Link("titlepage.xhtml", "Title Page & How to Use This Book", "titlepage")]
    for part in part_order:
        toc.append((epub.Section(part), part_map[part]))
    book.toc = tuple(toc)

    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())

    book.spine = ["nav", title_page] + chapter_items

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    epub.write_epub(OUT_PATH, book)
    print(f"wrote {OUT_PATH}")
    print(f"embedded {len(image_items)} images, {len(chapter_items)} chapters")


if __name__ == "__main__":
    main()
