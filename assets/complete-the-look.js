class CompleteTheLook extends HTMLElement {
  observer = undefined;

  connectedCallback() {
    // Skip fetching when the server already rendered recommendations
    // (i.e. this markup came back from a section rendering request).
    if (this.getAttribute('aria-busy') !== 'true') return;
    this.initializeRecommendations();
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }

  initializeRecommendations() {
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);
        this.loadRecommendations();
      },
      { rootMargin: '0px 0px 400px 0px' }
    );
    this.observer.observe(this);
  }

  async loadRecommendations() {
    try {
      const url = `${this.dataset.url}&product_id=${this.dataset.productId}&section_id=${this.dataset.sectionId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Recommendations request failed with status ${response.status}`);

      const text = await response.text();
      const html = new DOMParser().parseFromString(text, 'text/html');
      const fresh = html.querySelector('complete-the-look');

      if (fresh && fresh.innerHTML.trim().length) {
        this.innerHTML = fresh.innerHTML;
        this.setAttribute('aria-busy', 'false');
        this.classList.add('complete-the-look--loaded');
      } else {
        this.removeSection();
      }
    } catch (error) {
      console.error('[complete-the-look]', error);
      this.removeSection();
    }
  }

  // The API returning no products is a normal outcome, not an error state:
  // collapse the whole section (including its colour-scheme wrapper) rather
  // than leaving an empty band of padding on the page.
  removeSection() {
    const wrapper = this.closest('.complete-the-look-wrapper');
    (wrapper || this).remove();
  }
}

if (!customElements.get('complete-the-look')) {
  customElements.define('complete-the-look', CompleteTheLook);
}
