### Task 2: Implement Dynamic Data Fetching & Details Rendering

**Files:**
- Modify: `backend/public/index.html`

**Interfaces:**
- Consumes: `/api/equipments/:id` and `/api/equipments/:id/logs` endpoints.
- Produces: Dynamic row click handlers and rendering templates populating `#details-modal`.

- [ ] **Step 1: Update table row rendering to map onclick events**
  Inside the `renderTable` function in `backend/public/index.html`, modify `tr` generation:
  ```javascript
  // Change row layout declaration
  tr.setAttribute('onclick', `openDetailsModal('${e.id}')`);
  ```
  Ensure the image thumbnail container has `event.stopPropagation()` so clicking it doesn't open the detail modal:
  ```javascript
  photoCell = `
    <div class="photo-trigger" onclick="event.stopPropagation(); openModal('${photoUrl}')">
      <img class="photo-thumbnail" src="${photoUrl}" alt="Thumb">
    </div>
  `;
  ```

- [ ] **Step 2: Add openDetailsModal and closeDetailsModal functions**
  Add the following functions to the `<script>` tag:
  ```javascript
  async function openDetailsModal(id) {
    const modal = document.getElementById('details-modal');
    const infoContainer = document.getElementById('details-info-container');
    const timelineContainer = document.getElementById('details-timeline-container');

    infoContainer.innerHTML = `<div style="color: var(--text-sub)">Carregando detalhes...</div>`;
    timelineContainer.innerHTML = `<div style="color: var(--text-sub)">Carregando histórico...</div>`;

    modal.classList.add('show');

    try {
      const [equipment, logs] = await Promise.all([
        fetch(`/api/equipments/${id}`).then(r => r.json()),
        fetch(`/api/equipments/${id}/logs`).then(r => r.json())
      ]);

      // Render Left Column (Info)
      let galleryHtml = '';
      if (equipment.photos && equipment.photos.length > 0) {
        galleryHtml = `
          <div style="margin-top: 16px;">
            <span class="details-info-label" style="display: block; margin-bottom: 8px;">Galeria de Imagens:</span>
            <div class="details-gallery">
              ${equipment.photos.map(p => `
                <img src="${p.url}" alt="Foto" onclick="openModal('${p.url}')">
              `).join('')}
            </div>
          </div>
        `;
      }

      infoContainer.innerHTML = `
        <h2>${equipment.brand} ${equipment.model}</h2>
        <span class="details-code">${equipment.internal_code}</span>
        
        <div class="details-info-list">
          <div class="details-info-item">
            <span class="details-info-label">Tipo:</span>
            <span>${TYPE_LABELS[equipment.type] || equipment.type}</span>
          </div>
          <div class="details-info-item">
            <span class="details-info-label">Status:</span>
            <span class="col-status status-${equipment.status}">
              <span class="status-dot"></span>
              ${STATUS_LABELS[equipment.status] || equipment.status}
            </span>
          </div>
          <div class="details-info-item">
            <span class="details-info-label">Nº de Série:</span>
            <span>${equipment.serial_number || '<span style="color: var(--text-muted)">-</span>'}</span>
          </div>
          <div class="details-info-item">
            <span class="details-info-label">Localização:</span>
            <span>${equipment.location || '<span style="color: var(--text-muted)">-</span>'}</span>
          </div>
          <div class="details-info-item">
            <span class="details-info-label">Ficha Técnica:</span>
            <span style="display: block; margin-top: 4px; color: var(--text-sub); white-space: pre-wrap;">${equipment.specs || '-'}</span>
          </div>
          <div class="details-info-item">
            <span class="details-info-label">Notas Gerais:</span>
            <span style="display: block; margin-top: 4px; color: var(--text-sub); white-space: pre-wrap;">${equipment.notes || '-'}</span>
          </div>
        </div>
        ${galleryHtml}
      `;

      // Render Right Column (Logs Timeline)
      if (logs.length === 0) {
        timelineContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">Sem registros de manutenção anteriores.</div>`;
      } else {
        timelineContainer.innerHTML = logs.map(l => {
          const dateFormatted = l.date.slice(0, 10).split('-').reverse().join('/');
          let logPhotoHtml = '';
          if (l.photo_url) {
            logPhotoHtml = `<img class="timeline-photo" src="${l.photo_url}" alt="Log Photo" onclick="openModal('${l.photo_url}')">`;
          }
          return `
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-date">${dateFormatted}</div>
              <div class="timeline-desc">${l.description}</div>
              ${logPhotoHtml}
            </div>
          `;
        }).join('');
      }

    } catch (err) {
      infoContainer.innerHTML = `<div style="color: var(--destructive)">Erro ao carregar detalhes.</div>`;
      timelineContainer.innerHTML = `<div style="color: var(--destructive)">Erro ao carregar histórico.</div>`;
    }
  }

  function closeDetailsModal() {
    document.getElementById('details-modal').classList.remove('show');
  }
  ```

- [ ] **Step 3: Test modal overlays**
  Open `http://localhost:3000` in the browser, click on a row, and verify details and logs load correctly.
