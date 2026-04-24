function formatDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

const ALLOWED_TAGS = ["活動", "イベント", "お知らせ", "その他"];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCardHtml(post, index, basePath) {
  const imagePath = post.image || "src/img/noimg.png";
  const title = escapeHtml(post.title || "Untitled");
  const summary = escapeHtml(post.summary || "");
  const tag = escapeHtml(post.tag || "その他");
  const postUrl = post.url || "#";

  return `
    <article class="post-card" style="animation-delay: ${index * 0.06}s">
      <a class="post-image-link" href="${basePath}${postUrl}">
        <img class="post-image" src="${basePath}${imagePath}" alt="${title}" loading="lazy" />
      </a>
      <div class="post-meta">
        <span>${formatDate(post.date)}</span>
        <span class="post-tag">${tag}</span>
      </div>
      <h4><a class="post-title-link" href="${basePath}${postUrl}">${title}</a></h4>
      <p>${summary}</p>
    </article>
  `;
}

function getValidPosts(posts) {
  return posts.filter((post) => {
    const hasRequired = post && post.date && post.title && post.summary && post.url && post.tag;
    if (!hasRequired) {
      console.warn("Skipped blog post: required fields are missing.", post);
      return false;
    }

    if (!ALLOWED_TAGS.includes(post.tag)) {
      console.warn("Skipped blog post: invalid tag.", post);
      return false;
    }

    return true;
  });
}

function renderTagFilter(posts, selectedTag, onSelectTag) {
  const filterRoot = document.getElementById("blog-tag-filter");
  if (!filterRoot) {
    return;
  }

  const usedTags = ALLOWED_TAGS.filter((tag) => posts.some((post) => post.tag === tag));
  const tags = ["すべて", ...usedTags];

  filterRoot.innerHTML = tags
    .map(
      (tag) =>
        `<button class="tag-btn ${selectedTag === tag ? "is-active" : ""}" data-tag="${tag}">${tag}</button>`
    )
    .join("");

  filterRoot.querySelectorAll(".tag-btn").forEach((button) => {
    button.addEventListener("click", () => {
      onSelectTag(button.dataset.tag || "すべて");
    });
  });
}

function renderPagination(totalPages, currentPage, onPageChange) {
  const pager = document.getElementById("blog-pagination");
  if (!pager) {
    return;
  }

  if (totalPages <= 1) {
    pager.innerHTML = "";
    return;
  }

  let html = "";
  for (let page = 1; page <= totalPages; page += 1) {
    html += `
      <button class="pager-btn ${page === currentPage ? "is-active" : ""}" data-page="${page}" aria-label="Page ${page}">
        ${page}
      </button>
    `;
  }
  pager.innerHTML = html;

  pager.querySelectorAll(".pager-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const nextPage = Number(button.dataset.page);
      if (!Number.isNaN(nextPage) && nextPage !== currentPage) {
        onPageChange(nextPage);
      }
    });
  });
}

function renderPosts() {
  const list = document.getElementById("blog-list");
  if (!list) {
    return;
  }

  const basePath = list.dataset.basePath || "";
  const limit = Number(list.dataset.limit || "0");
  const paginate = list.dataset.paginate === "true";
  const pageSize = Number(list.dataset.pageSize || "15");
  const tagFilterEnabled = list.dataset.tagFilter === "true";
  const sourcePosts = Array.isArray(window.BLOG_POSTS) ? [...window.BLOG_POSTS] : [];
  const posts = getValidPosts(sourcePosts);
  let selectedTag = "すべて";

  // 日付の新しい順にソート
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (posts.length === 0) {
    list.innerHTML = "<p>表示可能な投稿はまだありません。tag を確認してください。</p>";
    renderPagination(0, 0, () => {});
    return;
  }

  const renderList = () => {
    const existingNote = document.querySelector(".more-posts-note");
    if (existingNote) {
      existingNote.remove();
    }

    const targetPosts =
      selectedTag === "すべて" ? posts : posts.filter((post) => post.tag === selectedTag);

    if (targetPosts.length === 0) {
      list.innerHTML = "<p>このタグの投稿はありません。</p>";
      renderPagination(0, 0, () => {});
      return;
    }

    if (paginate) {
      let currentPage = 1;
      const totalPages = Math.max(1, Math.ceil(targetPosts.length / pageSize));

      const showPage = (page) => {
        currentPage = page;
        const start = (currentPage - 1) * pageSize;
        const currentPosts = targetPosts.slice(start, start + pageSize);
        list.innerHTML = currentPosts
          .map((post, index) => getCardHtml(post, index, basePath))
          .join("");
        renderPagination(totalPages, currentPage, showPage);
        list.scrollIntoView({ behavior: "smooth", block: "start" });
      };

      showPage(1);
      return;
    }

    const visiblePosts = limit > 0 ? targetPosts.slice(0, limit) : targetPosts;
    list.innerHTML = visiblePosts
      .map((post, index) => getCardHtml(post, index, basePath))
      .join("");

    if (limit > 0 && targetPosts.length > limit) {
      list.insertAdjacentHTML(
        "afterend",
        '<p class="more-posts-note"><a class="text-link" href="blog.html">View All Posts</a></p>'
      );
    }
  };

  if (tagFilterEnabled) {
    const handleTagChange = (nextTag) => {
      selectedTag = nextTag;
      renderTagFilter(posts, selectedTag, handleTagChange);
      renderList();
    };

    renderTagFilter(posts, selectedTag, handleTagChange);
  }

  renderList();
}

document.addEventListener("DOMContentLoaded", renderPosts);
