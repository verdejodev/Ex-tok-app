### Task 1: Add Modal Markup & CSS Styles

**Files:**
- Modify: `backend/public/index.html`

**Interfaces:**
- Produces: CSS rules and HTML elements for `#details-modal` visible in the web page DOM.

- [ ] **Step 1: Add HTML elements for the details modal**
  Place the following markup right below the photo modal (`#photo-modal`) in `backend/public/index.html`:
  ```html
  <!-- Modal de Detalhes Completo -->
  <div id="details-modal" class="modal" onclick="closeDetailsModal()">
    <div class="details-modal-container" onclick="event.stopPropagation()">
      <button class="details-modal-close" onclick="closeDetailsModal()">✕</button>
      <div class="details-grid">
        <div class="details-left-col" id="details-info-container">
          <!-- Carregado via JS -->
        </div>
        <div class="details-right-col">
          <h3>Histórico de Manutenções</h3>
          <div class="details-timeline" id="details-timeline-container">
            <!-- Carregado via JS -->
          </div>
        </div>
      </div>
    </div>
  </div>
  ```

- [ ] **Step 2: Add CSS rules for details layout**
  Inject these styles in the `<style>` block:
  ```css
  /* Details Modal Styles */
  .details-modal-container {
    background-color: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    width: 90%;
    max-width: 850px;
    max-height: 85vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  }

  .details-modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    color: var(--text-sub);
    font-size: 20px;
    cursor: pointer;
    transition: color 0.2s;
  }

  .details-modal-close:hover {
    color: var(--primary);
  }

  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 12px;
  }

  @media (max-width: 768px) {
    .details-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Left Column & Info styles */
  .details-left-col h2 {
    color: var(--text);
    font-size: 22px;
    margin-bottom: 4px;
  }

  .details-code {
    color: var(--primary);
    font-family: var(--font-mono);
    font-size: 13px;
    margin-bottom: 16px;
    display: inline-block;
  }

  .details-info-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .details-info-item {
    font-size: 14px;
    line-height: 1.4;
  }

  .details-info-label {
    color: var(--text-sub);
    font-weight: 500;
    margin-right: 6px;
  }

  .details-gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  .details-gallery img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .details-gallery img:hover {
    border-color: var(--primary);
  }

  /* Right Column & Timeline styles */
  .details-right-col h3 {
    font-size: 16px;
    color: var(--text);
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border);
    padding-bottom: 8px;
  }

  .details-timeline {
    position: relative;
    padding-left: 20px;
    border-left: 2px solid var(--border);
    margin-left: 8px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .timeline-item {
    position: relative;
  }

  .timeline-dot {
    position: absolute;
    left: -25px;
    top: 5px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--primary);
    box-shadow: 0 0 8px var(--primary);
  }

  .timeline-date {
    font-size: 11px;
    color: var(--primary);
    font-family: var(--font-mono);
    margin-bottom: 4px;
  }

  .timeline-desc {
    font-size: 13px;
    color: var(--text-sub);
    line-height: 1.4;
  }

  .timeline-photo {
    width: 120px;
    height: 80px;
    object-fit: cover;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    margin-top: 8px;
    cursor: pointer;
    display: block;
  }

  .timeline-photo:hover {
    border-color: var(--primary);
  }

  /* Clickable rows pointer */
  tbody tr {
    cursor: pointer;
  }
  ```

---

