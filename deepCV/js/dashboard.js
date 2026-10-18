/**
 * Soe Ye Htut - Complete Admin Dashboard Client Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginContainer = document.getElementById('login-container');
  const dashboardContainer = document.getElementById('dashboard-container');
  const loginForm = document.getElementById('login-form');
  const logoutBtn = document.getElementById('logout-btn');

  let adminToken = localStorage.getItem('adminToken');

  if (adminToken) {
    showDashboard();
  }

  // Admin Login Form
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const password = document.getElementById('admin-password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
      }

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });

        const data = await res.json();
        if (res.ok && data.token) {
          adminToken = data.token;
          localStorage.setItem('adminToken', adminToken);
          showToast('Login successful!');
          showDashboard();
        } else {
          showToast(data.error || 'Invalid admin password', 'error');
        }
      } catch (err) {
        showToast('Network error during login', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-lock"></i> Login';
        }
      }
    };
  }

  // Logout Handler
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem('adminToken');
      adminToken = null;
      dashboardContainer.style.display = 'none';
      loginContainer.style.display = 'flex';
      showToast('Logged out successfully.');
    };
  }

  function showDashboard() {
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'block';

    initDashboardData();
  }

  // Dashboard Tabs Switcher
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanelId = tab.getAttribute('data-tab');
      const panel = document.getElementById(targetPanelId);
      if (panel) panel.classList.add('active');
    });
  });

  // Modal Backdrop & Escape Key Handlers
  const modals = [
    document.getElementById('service-modal'),
    document.getElementById('skill-modal'),
    document.getElementById('soft-skill-modal'),
    document.getElementById('project-modal'),
    document.getElementById('journey-modal')
  ];

  window.addEventListener('click', (e) => {
    modals.forEach((m) => {
      if (m && e.target === m) m.style.display = 'none';
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modals.forEach((m) => {
        if (m) m.style.display = 'none';
      });
    }
  });

  // Setup Close Buttons
  const modalClosePairs = [
    ['close-service-modal', 'service-modal'],
    ['close-skill-modal', 'skill-modal'],
    ['close-soft-skill-modal', 'soft-skill-modal'],
    ['close-project-modal', 'project-modal'],
    ['close-journey-modal', 'journey-modal']
  ];

  modalClosePairs.forEach(([btnId, modalId]) => {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    if (btn && modal) {
      btn.onclick = () => { modal.style.display = 'none'; };
    }
  });

  // Data Fetching & Rendering
  async function initDashboardData() {
    loadSectionSettings();
    loadBioData();
    loadServicesData();
    loadSkillsData();
    loadSoftSkillsData();
    loadProjectsData();
    loadJourneyData();
    loadReviewsData();
    loadMessagesData();
  }

  // Helper Auth Fetch
  async function authFetch(url, options = {}) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${adminToken}`
    };
    const res = await fetch(url, options);
    if (res.status === 401) {
      showToast('Session expired. Please log in again.', 'error');
      localStorage.removeItem('adminToken');
      dashboardContainer.style.display = 'none';
      loginContainer.style.display = 'flex';
      throw new Error('Unauthorized');
    }
    return res;
  }

  // ==========================================
  // 1. Sections Control Manager
  // ==========================================
  async function loadSectionSettings() {
    const container = document.getElementById('sections-container');
    if (!container) return;

    try {
      const res = await fetch('/api/sections');
      if (res.ok) {
        const sectionsList = await res.json();
        container.innerHTML = '';
        sectionsList.forEach((sec) => {
          const wrapper = document.createElement('div');
          wrapper.className = 'switch-wrapper';
          wrapper.style.display = 'flex';
          wrapper.style.alignItems = 'center';
          wrapper.style.gap = '1.5rem';
          wrapper.style.padding = '1.5rem 2rem';

          wrapper.innerHTML = `
            <div style="flex: 1; display: flex; align-items: center; gap: 1rem;">
              <span style="font-weight: 700; color: var(--main-color); text-transform: uppercase; font-size: 1.2rem; min-width: 90px;">#${sec.section_id}</span>
              <input type="text" class="section-title-input" data-section="${sec.section_id}" value="${sec.title || ''}" style="background: rgba(11, 15, 23, 0.8); border: 1px solid var(--card-border); padding: 0.8rem 1.2rem; border-radius: var(--radius-sm); color: #fff; font-size: 1.4rem; flex: 1;" placeholder="Section Heading" />
            </div>
            <label class="switch">
              <input type="checkbox" class="section-toggle" data-section="${sec.section_id}" ${sec.is_visible ? 'checked' : ''} />
              <span class="slider"></span>
            </label>
          `;
          container.appendChild(wrapper);
        });
      }
    } catch (err) {
      console.error('Failed to load sections:', err);
    }
  }

  const saveSectionsBtn = document.getElementById('save-sections-btn');
  if (saveSectionsBtn) {
    saveSectionsBtn.onclick = async () => {
      const toggles = document.querySelectorAll('.section-toggle');
      const titleInputs = document.querySelectorAll('.section-title-input');
      const sections = [];

      toggles.forEach((t) => {
        const secId = t.getAttribute('data-section');
        const titleInput = Array.from(titleInputs).find(input => input.getAttribute('data-section') === secId);
        sections.push({
          section_id: secId,
          title: titleInput ? titleInput.value : '',
          is_visible: t.checked
        });
      });

      saveSectionsBtn.disabled = true;
      saveSectionsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      try {
        const res = await authFetch('/api/admin/sections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sections })
        });
        if (res.ok) {
          showToast('All section visibility & title settings saved!');
        } else {
          showToast('Failed to save section settings.', 'error');
        }
      } catch (err) {
        showToast('Error saving sections.', 'error');
      } finally {
        saveSectionsBtn.disabled = false;
        saveSectionsBtn.innerHTML = '<i class="fas fa-save"></i> Save Section Settings';
      }
    };
  }

  // ==========================================
  // 2. Profile, Home, About, Contact Settings
  // ==========================================
  let currentBio = {};

  async function loadBioData() {
    try {
      const res = await fetch('/api/bio');
      if (res.ok) {
        currentBio = await res.json();
        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.value = val !== undefined && val !== null ? val : '';
        };

        // Home Fields
        setVal('home-greeting-input', currentBio.greeting || "Hello, It's Me");
        setVal('bio-name', currentBio.name || '');
        setVal('bio-title', currentBio.title || '');
        setVal('bio-roles', currentBio.roles || currentBio.title || '');
        setVal('bio-description', currentBio.description || '');
        setVal('bio-avatar-url', currentBio.avatar_url || '');
        setVal('bio-cv-url', currentBio.cv_url || '');
        setVal('social-facebook-input', currentBio.social_facebook || '');
        setVal('social-twitter-input', currentBio.social_twitter || '');
        setVal('social-instagram-input', currentBio.social_instagram || '');
        setVal('social-linkedin-input', currentBio.social_linkedin || '');
        setVal('social-github-input', currentBio.social_github || '');

        // About Fields
        setVal('about-subtitle-input', currentBio.about_subtitle || currentBio.title || '');
        setVal('about-description-input', currentBio.about_description || currentBio.description || '');
        setVal('bio-about-url', currentBio.about_image_url || '');
        setVal('stat1-number-input', currentBio.stat1_number || '3+');
        setVal('stat1-label-input', currentBio.stat1_label || 'Featured Projects');
        setVal('stat2-number-input', currentBio.stat2_number || '100%');
        setVal('stat2-label-input', currentBio.stat2_label || 'Dedication');
        setVal('stat3-number-input', currentBio.stat3_number || '24/7');
        setVal('stat3-label-input', currentBio.stat3_label || 'Eager to Learn');

        // Contact & Footer Fields
        setVal('contact-email-input', currentBio.contact_email || '');
        setVal('contact-phone-input', currentBio.contact_phone || '');
        setVal('contact-location-input', currentBio.contact_location || '');
        setVal('footer-text-input', currentBio.footer_text || 'Copyright © 2026 by Soe Ye Htut | All Rights Reserved.');
      }
    } catch (err) {
      console.error('Failed to load bio:', err);
    }
  }

  async function saveBioUpdates(updates, submitBtn, originalHtml, successMsg) {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    const payload = {
      ...currentBio,
      ...updates
    };

    try {
      const res = await authFetch('/api/admin/bio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        currentBio = await res.json();
        showToast(successMsg || 'Settings saved successfully!');
      } else {
        showToast('Failed to save settings.', 'error');
      }
    } catch (err) {
      showToast('Error saving settings.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
    }
  }

  // Home Form
  const homeForm = document.getElementById('home-form');
  if (homeForm) {
    homeForm.onsubmit = (e) => {
      e.preventDefault();
      const submitBtn = homeForm.querySelector('button[type="submit"]');
      const updates = {
        greeting: document.getElementById('home-greeting-input').value,
        name: document.getElementById('bio-name').value,
        title: document.getElementById('bio-title').value,
        roles: document.getElementById('bio-roles').value,
        description: document.getElementById('bio-description').value,
        avatar_url: document.getElementById('bio-avatar-url').value,
        cv_url: document.getElementById('bio-cv-url').value,
        social_facebook: document.getElementById('social-facebook-input').value,
        social_twitter: document.getElementById('social-twitter-input').value,
        social_instagram: document.getElementById('social-instagram-input').value,
        social_linkedin: document.getElementById('social-linkedin-input').value,
        social_github: document.getElementById('social-github-input').value
      };
      saveBioUpdates(updates, submitBtn, '<i class="fas fa-save"></i> Save Home / Hero Settings', 'Home / Hero settings updated!');
    };
  }

  // About Form
  const aboutForm = document.getElementById('about-form');
  if (aboutForm) {
    aboutForm.onsubmit = (e) => {
      e.preventDefault();
      const submitBtn = aboutForm.querySelector('button[type="submit"]');
      const updates = {
        about_subtitle: document.getElementById('about-subtitle-input').value,
        about_description: document.getElementById('about-description-input').value,
        about_image_url: document.getElementById('bio-about-url').value,
        stat1_number: document.getElementById('stat1-number-input').value,
        stat1_label: document.getElementById('stat1-label-input').value,
        stat2_number: document.getElementById('stat2-number-input').value,
        stat2_label: document.getElementById('stat2-label-input').value,
        stat3_number: document.getElementById('stat3-number-input').value,
        stat3_label: document.getElementById('stat3-label-input').value
      };
      saveBioUpdates(updates, submitBtn, '<i class="fas fa-save"></i> Save About Settings', 'About section settings updated!');
    };
  }

  // Contact & Footer Form
  const contactSettingsForm = document.getElementById('contact-settings-form');
  if (contactSettingsForm) {
    contactSettingsForm.onsubmit = (e) => {
      e.preventDefault();
      const submitBtn = contactSettingsForm.querySelector('button[type="submit"]');
      const updates = {
        contact_email: document.getElementById('contact-email-input').value,
        contact_phone: document.getElementById('contact-phone-input').value,
        contact_location: document.getElementById('contact-location-input').value,
        footer_text: document.getElementById('footer-text-input').value
      };
      saveBioUpdates(updates, submitBtn, '<i class="fas fa-save"></i> Save Contact & Footer Settings', 'Contact & Footer settings updated!');
    };
  }

  // File Upload Handlers
  window.uploadFile = async function (inputId, targetUrlId) {
    const fileInput = document.getElementById(inputId);
    if (!fileInput.files || fileInput.files.length === 0) {
      showToast('Please select a file to upload.', 'error');
      return;
    }

    const labelEl = document.querySelector(`label[for="${inputId}"]`);
    const originalLabel = labelEl ? labelEl.textContent : 'Browse';
    if (labelEl) labelEl.textContent = 'Uploading...';

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    try {
      const res = await authFetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.fileUrl) {
        document.getElementById(targetUrlId).value = data.fileUrl;
        showToast('Image uploaded successfully!');
      } else {
        showToast(data.error || 'Upload failed.', 'error');
      }
    } catch (err) {
      showToast('Upload failed.', 'error');
    } finally {
      if (labelEl) labelEl.textContent = originalLabel;
    }
  };

  window.uploadCvFile = async function (inputId, targetUrlId) {
    const fileInput = document.getElementById(inputId);
    if (!fileInput.files || fileInput.files.length === 0) {
      showToast('Please select a PDF file to upload.', 'error');
      return;
    }

    const labelEl = document.querySelector(`label[for="${inputId}"]`);
    const originalLabel = labelEl ? labelEl.textContent : 'Upload PDF';
    if (labelEl) labelEl.textContent = 'Uploading...';

    const formData = new FormData();
    formData.append('cv_file', fileInput.files[0]);

    try {
      const res = await authFetch('/api/admin/upload/cv', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.fileUrl) {
        document.getElementById(targetUrlId).value = data.fileUrl;
        showToast('CV PDF uploaded successfully!');
      } else {
        showToast(data.error || 'CV upload failed.', 'error');
      }
    } catch (err) {
      showToast('CV upload failed.', 'error');
    } finally {
      if (labelEl) labelEl.textContent = originalLabel;
    }
  };

  // ==========================================
  // 3. Services Manager
  // ==========================================
  async function loadServicesData() {
    const container = document.getElementById('services-grid');
    if (!container) return;

    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const services = await res.json();
        container.innerHTML = '';

        const metricEl = document.getElementById('metric-services-count');
        if (metricEl) metricEl.textContent = services.length;

        if (services.length === 0) {
          container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #94a3b8;">No services added yet. Add one above!</div>';
          return;
        }

        services.forEach((s) => {
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <div class="card-body">
              <i class="${s.icon || 'fas fa-code'}" style="font-size: 3.5rem; color: var(--main-color); margin-bottom: 1.5rem;"></i>
              <h4>${s.title}</h4>
              <p>${s.description}</p>
              <div class="card-actions">
                <button class="edit-btn" onclick="editService(${s.id})"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete-btn" onclick="deleteService(${s.id})"><i class="fas fa-trash"></i> Delete</button>
              </div>
            </div>
          `;
          container.appendChild(card);
        });
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  }

  window.openAddServiceModal = function () {
    const form = document.getElementById('service-form');
    if (form) form.reset();
    document.getElementById('service-id').value = '';
    document.getElementById('service-modal-title').textContent = 'Add Service';
    document.getElementById('service-modal').style.display = 'flex';
  };

  window.editService = async function (id) {
    const res = await fetch('/api/services');
    if (res.ok) {
      const services = await res.json();
      const s = services.find(item => item.id === id);
      if (s) {
        document.getElementById('service-id').value = s.id;
        document.getElementById('service-title').value = s.title;
        document.getElementById('service-icon').value = s.icon;
        document.getElementById('service-description').value = s.description;

        document.getElementById('service-modal-title').textContent = 'Edit Service';
        document.getElementById('service-modal').style.display = 'flex';
      }
    }
  };

  const serviceForm = document.getElementById('service-form');
  if (serviceForm) {
    serviceForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('service-id').value;
      const payload = {
        title: document.getElementById('service-title').value,
        icon: document.getElementById('service-icon').value,
        description: document.getElementById('service-description').value
      };

      const isEdit = !!id;
      const url = isEdit ? `/api/admin/services/${id}` : '/api/admin/services';
      const method = isEdit ? 'PUT' : 'POST';

      try {
        const res = await authFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast(`Service ${isEdit ? 'updated' : 'added'} successfully!`);
          document.getElementById('service-modal').style.display = 'none';
          loadServicesData();
        } else {
          showToast('Failed to save service.', 'error');
        }
      } catch (err) {
        showToast('Error saving service.', 'error');
      }
    };
  }

  window.deleteService = async function (id) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const res = await authFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Service deleted!');
        loadServicesData();
      } else {
        showToast('Failed to delete service.', 'error');
      }
    } catch (err) {
      showToast('Error deleting service.', 'error');
    }
  };

  // ==========================================
  // 4. Technical Skills Manager
  // ==========================================
  async function loadSkillsData() {
    const container = document.getElementById('skills-grid');
    if (!container) return;

    try {
      const res = await fetch('/api/skills');
      if (res.ok) {
        const skills = await res.json();
        container.innerHTML = '';

        const metricEl = document.getElementById('metric-skills-count');
        if (metricEl) metricEl.textContent = skills.length;

        if (skills.length === 0) {
          container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #94a3b8;">No skills added yet. Add one above!</div>';
          return;
        }

        skills.forEach((sk) => {
          const card = document.createElement('div');
          card.className = 'card';
          const brandColor = sk.color || '#00f2fe';
          card.innerHTML = `
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <i class="${sk.icon || 'fas fa-code'}" style="font-size: 3.5rem; color: ${brandColor};"></i>
                <span class="badge" style="background: ${brandColor}; color: ${brandColor === '#F7DF1E' ? '#0b0f17' : '#fff'}; margin-bottom: 0;">${sk.percentage}%</span>
              </div>
              <h4>${sk.name}</h4>
              <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: var(--radius-full); overflow: hidden; margin-bottom: 1.5rem;">
                <div style="width: ${sk.percentage}%; height: 100%; background: ${brandColor};"></div>
              </div>
              <div class="card-actions">
                <button class="edit-btn" onclick="editSkill(${sk.id})"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete-btn" onclick="deleteSkill(${sk.id})"><i class="fas fa-trash"></i> Delete</button>
              </div>
            </div>
          `;
          container.appendChild(card);
        });
      }
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  }

  window.openAddSkillModal = function () {
    const form = document.getElementById('skill-form');
    if (form) form.reset();
    document.getElementById('skill-id').value = '';
    document.getElementById('skill-color').value = '#00f2fe';
    document.getElementById('skill-color-picker').value = '#00f2fe';
    document.getElementById('skill-modal-title').textContent = 'Add Technical Skill';
    document.getElementById('skill-modal').style.display = 'flex';
  };

  window.editSkill = async function (id) {
    const res = await fetch('/api/skills');
    if (res.ok) {
      const skills = await res.json();
      const sk = skills.find(item => item.id === id);
      if (sk) {
        document.getElementById('skill-id').value = sk.id;
        document.getElementById('skill-name').value = sk.name;
        document.getElementById('skill-percentage').value = sk.percentage;
        document.getElementById('skill-icon').value = sk.icon;
        document.getElementById('skill-color').value = sk.color;
        document.getElementById('skill-color-picker').value = sk.color;

        document.getElementById('skill-modal-title').textContent = 'Edit Technical Skill';
        document.getElementById('skill-modal').style.display = 'flex';
      }
    }
  };

  const skillForm = document.getElementById('skill-form');
  if (skillForm) {
    skillForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('skill-id').value;
      const payload = {
        name: document.getElementById('skill-name').value,
        percentage: parseInt(document.getElementById('skill-percentage').value),
        icon: document.getElementById('skill-icon').value,
        color: document.getElementById('skill-color').value
      };

      const isEdit = !!id;
      const url = isEdit ? `/api/admin/skills/${id}` : '/api/admin/skills';
      const method = isEdit ? 'PUT' : 'POST';

      try {
        const res = await authFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast(`Skill ${isEdit ? 'updated' : 'added'} successfully!`);
          document.getElementById('skill-modal').style.display = 'none';
          loadSkillsData();
        } else {
          showToast('Failed to save skill.', 'error');
        }
      } catch (err) {
        showToast('Error saving skill.', 'error');
      }
    };
  }

  window.deleteSkill = async function (id) {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    try {
      const res = await authFetch(`/api/admin/skills/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Skill deleted!');
        loadSkillsData();
      } else {
        showToast('Failed to delete skill.', 'error');
      }
    } catch (err) {
      showToast('Error deleting skill.', 'error');
    }
  };

  // ==========================================
  // 5. Soft Skills Manager
  // ==========================================
  async function loadSoftSkillsData() {
    const container = document.getElementById('soft-skills-grid');
    if (!container) return;

    try {
      const res = await fetch('/api/soft-skills');
      if (res.ok) {
        const softSkills = await res.json();
        container.innerHTML = '';

        if (softSkills.length === 0) {
          container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #94a3b8;">No soft skills added yet. Add one above!</div>';
          return;
        }

        softSkills.forEach((sf) => {
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <div class="card-body">
              <i class="${sf.icon || 'fas fa-comments'}" style="font-size: 3.5rem; color: var(--main-color); margin-bottom: 1.5rem;"></i>
              <h4>${sf.title}</h4>
              <p>${sf.description}</p>
              <div class="card-actions">
                <button class="edit-btn" onclick="editSoftSkill(${sf.id})"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete-btn" onclick="deleteSoftSkill(${sf.id})"><i class="fas fa-trash"></i> Delete</button>
              </div>
            </div>
          `;
          container.appendChild(card);
        });
      }
    } catch (err) {
      console.error('Failed to load soft skills:', err);
    }
  }

  window.openAddSoftSkillModal = function () {
    const form = document.getElementById('soft-skill-form');
    if (form) form.reset();
    document.getElementById('soft-skill-id').value = '';
    document.getElementById('soft-skill-modal-title').textContent = 'Add Soft Skill';
    document.getElementById('soft-skill-modal').style.display = 'flex';
  };

  window.editSoftSkill = async function (id) {
    const res = await fetch('/api/soft-skills');
    if (res.ok) {
      const softSkills = await res.json();
      const sf = softSkills.find(item => item.id === id);
      if (sf) {
        document.getElementById('soft-skill-id').value = sf.id;
        document.getElementById('soft-skill-title').value = sf.title;
        document.getElementById('soft-skill-icon').value = sf.icon;
        document.getElementById('soft-skill-description').value = sf.description;

        document.getElementById('soft-skill-modal-title').textContent = 'Edit Soft Skill';
        document.getElementById('soft-skill-modal').style.display = 'flex';
      }
    }
  };

  const softSkillForm = document.getElementById('soft-skill-form');
  if (softSkillForm) {
    softSkillForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('soft-skill-id').value;
      const payload = {
        title: document.getElementById('soft-skill-title').value,
        icon: document.getElementById('soft-skill-icon').value,
        description: document.getElementById('soft-skill-description').value
      };

      const isEdit = !!id;
      const url = isEdit ? `/api/admin/soft-skills/${id}` : '/api/admin/soft-skills';
      const method = isEdit ? 'PUT' : 'POST';

      try {
        const res = await authFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showToast(`Soft skill ${isEdit ? 'updated' : 'added'} successfully!`);
          document.getElementById('soft-skill-modal').style.display = 'none';
          loadSoftSkillsData();
        } else {
          showToast('Failed to save soft skill.', 'error');
        }
      } catch (err) {
        showToast('Error saving soft skill.', 'error');
      }
    };
  }

  window.deleteSoftSkill = async function (id) {
    if (!confirm('Are you sure you want to delete this soft skill?')) return;
    try {
      const res = await authFetch(`/api/admin/soft-skills/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Soft skill deleted!');
        loadSoftSkillsData();
      } else {
        showToast('Failed to delete soft skill.', 'error');
      }
    } catch (err) {
      showToast('Error deleting soft skill.', 'error');
    }
  };

  // ==========================================
  // 6. Projects Manager
  // ==========================================
  async function loadProjectsData() {
    const container = document.getElementById('projects-grid');
    if (!container) return;

    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const projects = await res.json();
        container.innerHTML = '';

        const metricEl = document.getElementById('metric-projects-count');
        if (metricEl) metricEl.textContent = projects.length;

        if (projects.length === 0) {
          container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #94a3b8;">No projects found. Add one above!</div>';
          return;
        }

        projects.forEach((p) => {
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <img src="${p.image_url || 'image/image/home-img.png'}" alt="${p.title}" />
            <div class="card-body">
              <span class="badge">${p.type || 'frontend'}</span>
              <h4>${p.title}</h4>
              <p>${p.description || ''}</p>
              <div class="card-actions">
                <button class="edit-btn" onclick="editProject(${p.id})"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete-btn" onclick="deleteProject(${p.id})"><i class="fas fa-trash"></i> Delete</button>
              </div>
            </div>
          `;
          container.appendChild(card);
        });
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }

  window.editProject = async function (id) {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const projects = await res.json();
      const p = projects.find((proj) => proj.id === id);
      if (p) {
        document.getElementById('project-id').value = p.id;
        document.getElementById('project-title').value = p.title;
        document.getElementById('project-type').value = p.type || 'frontend';
        document.getElementById('project-image-url').value = p.image_url || '';
        document.getElementById('project-url').value = p.project_url || '';
        document.getElementById('project-description').value = p.description || '';

        document.getElementById('project-modal-title').textContent = 'Edit Project';
        document.getElementById('project-modal').style.display = 'flex';
      }
    }
  };

  window.openAddProjectModal = function () {
    const projectForm = document.getElementById('project-form');
    if (projectForm) projectForm.reset();
    document.getElementById('project-id').value = '';
    document.getElementById('project-modal-title').textContent = 'Add New Project';
    document.getElementById('project-modal').style.display = 'flex';
  };

  const projectForm = document.getElementById('project-form');
  if (projectForm) {
    projectForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('project-id').value;
      const submitBtn = projectForm.querySelector('button[type="submit"]');

      let inputProjectUrl = (document.getElementById('project-url').value || '').trim();
      if (inputProjectUrl && inputProjectUrl !== '#' && !/^https?:\/\//i.test(inputProjectUrl)) {
        inputProjectUrl = 'https://' + inputProjectUrl;
      }

      const payload = {
        title: document.getElementById('project-title').value,
        type: document.getElementById('project-type').value,
        image_url: document.getElementById('project-image-url').value,
        project_url: inputProjectUrl,
        description: document.getElementById('project-description').value
      };

      const isEdit = !!id;
      const url = isEdit ? `/api/admin/projects/${id}` : '/api/admin/projects';
      const method = isEdit ? 'PUT' : 'POST';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      }

      try {
        const res = await authFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast(`Project ${isEdit ? 'updated' : 'added'} successfully!`);
          document.getElementById('project-modal').style.display = 'none';
          loadProjectsData();
        } else {
          showToast(`Failed to ${isEdit ? 'update' : 'add'} project.`, 'error');
        }
      } catch (err) {
        showToast('Error saving project.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save Project';
        }
      }
    };
  }

  window.deleteProject = async function (id) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await authFetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Project deleted successfully!');
        loadProjectsData();
      } else {
        showToast('Failed to delete project.', 'error');
      }
    } catch (err) {
      showToast('Error deleting project.', 'error');
    }
  };

  // ==========================================
  // 7. Journey Timeline Manager (Easy Add & Templates)
  // ==========================================
  function parseTimelineYears(timePeriod) {
    if (!timePeriod) return { start: 9999, end: 9999 };
    const str = String(timePeriod);
    const years = str.match(/\b(19\d\d|20\d\d)\b/g);
    let start = 9999;
    let end = 9999;

    if (years && years.length > 0) {
      start = parseInt(years[0], 10);
      if (years.length > 1) {
        end = parseInt(years[1], 10);
      } else if (/present/i.test(str)) {
        end = 9999;
      } else {
        end = start;
      }
    } else if (/present/i.test(str)) {
      start = new Date().getFullYear();
      end = 9999;
    }

    return { start, end };
  }

  function sortJourneyChronological(items) {
    if (!Array.isArray(items)) return [];
    return [...items].sort((a, b) => {
      const aDates = parseTimelineYears(a.time_period);
      const bDates = parseTimelineYears(b.time_period);
      if (aDates.start !== bDates.start) {
        return aDates.start - bDates.start;
      }
      if (aDates.end !== bDates.end) {
        return aDates.end - bDates.end;
      }
      return (a.id || 0) - (b.id || 0);
    });
  }

  async function loadJourneyData() {
    const container = document.getElementById('journey-list');
    if (!container) return;

    try {
      const res = await fetch('/api/journey');
      if (res.ok) {
        const rawItems = await res.json();
        const items = sortJourneyChronological(rawItems);
        container.innerHTML = '';

        const metricEl = document.getElementById('metric-journey-count');
        if (metricEl) metricEl.textContent = items.length;

        if (items.length === 0) {
          container.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 3rem; background: var(--card-bg); border-radius: var(--radius-md); border: 1px dashed var(--card-border);">No timeline entries yet. Use the Quick Add form above to create your first one!</div>';
          return;
        }

        items.forEach((j) => {
          const card = document.createElement('div');
          card.className = 'card';
          card.style.marginBottom = '1.8rem';
          const institutionName = j.institution || (j.title.includes(' - ') ? j.title.split(' - ')[1] : (j.title.includes('Roehampton') ? 'University of Roehampton' : ''));
          const displayTitle = j.title;
          const categoryName = j.category || 'Experience';

          card.innerHTML = `
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem; flex-wrap: wrap; gap: 0.8rem;">
                <div style="display: flex; gap: 0.8rem; align-items: center; flex-wrap: wrap;">
                  <span class="badge" style="margin: 0; font-size: 1.2rem; display: inline-flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-calendar-alt"></i> ${j.time_period || 'Present'}
                  </span>
                  <span class="badge badge-primary" style="margin: 0; font-size: 1.15rem; background: rgba(0, 242, 254, 0.12); color: var(--main-color); border: 1px solid rgba(0, 242, 254, 0.3);">
                    ${categoryName}
                  </span>
                </div>
                <span style="font-size: 1.2rem; color: var(--text-muted);">ID: #${j.id}</span>
              </div>

              ${institutionName ? `
                <div style="display: inline-flex; align-items: center; gap: 0.8rem; background: rgba(0, 242, 254, 0.08); border: 1.5px solid rgba(0, 242, 254, 0.3); padding: 0.6rem 1.2rem; border-radius: 8px; margin-bottom: 0.8rem;">
                  <i class="fas fa-university" style="color: var(--main-color); font-size: 1.4rem;"></i>
                  <strong style="color: var(--text-color); font-size: 1.5rem; letter-spacing: 0.2px;">${institutionName}</strong>
                </div>
              ` : ''}

              <h4 style="font-size: 1.9rem; margin-bottom: 0.8rem; color: var(--text-color);">${displayTitle}</h4>
              <p style="white-space: pre-line; line-height: 1.6; margin-bottom: 1.5rem; color: var(--text-muted); font-size: 1.4rem;">${j.description || ''}</p>
              <div class="card-actions">
                <button class="edit-btn" onclick="editJourney(${j.id})"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-secondary" style="width: auto; padding: 0.9rem 1.4rem;" onclick="cloneJourney(${j.id})" title="Copy to form as template"><i class="fas fa-copy"></i> Use as Template</button>
                <button class="delete-btn" onclick="deleteJourney(${j.id})"><i class="fas fa-trash"></i> Delete</button>
              </div>
            </div>
          `;
          container.appendChild(card);
        });
      }
    } catch (err) {
      console.error('Failed to load journey:', err);
    }
  }

  // Quick Date Helpers
  window.setQuickDate = function (val) {
    const el = document.getElementById('quick-journey-time');
    if (el) {
      el.value = val;
      el.focus();
    }
  };

  window.setModalDate = function (val) {
    const el = document.getElementById('journey-time');
    if (el) {
      el.value = val;
      el.focus();
    }
  };

  // Add Bullet Point Helper
  window.addBulletPoint = function (textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;
    const bullet = "• ";
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    if (val.length === 0 || val.endsWith("\n")) {
      textarea.value = val + bullet;
    } else {
      textarea.value = val + "\n" + bullet;
    }
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
  };

  // Category Presets Helper
  window.applyJourneyPreset = function (type) {
    const instEl = document.getElementById('quick-journey-institution');
    const titleEl = document.getElementById('quick-journey-title');
    const catEl = document.getElementById('quick-journey-category');
    const timeEl = document.getElementById('quick-journey-time');
    const descEl = document.getElementById('quick-journey-desc');

    if (type === 'diploma') {
      if (instEl) instEl.value = 'Higher Diploma In Software Engineering';
      if (titleEl) titleEl.value = 'Higher Diploma in Software Engineering';
      if (catEl) catEl.value = 'Specialized Diploma';
      if (timeEl) timeEl.value = '2021 - 2023';
      if (descEl) descEl.value = '• Intensive applied diploma in modern software engineering, web architectures, agile development, and enterprise databases.\n• Completed industry-aligned full-stack capstone projects with high distinction.';
    } else if (type === 'roehampton') {
      if (instEl) instEl.value = 'University of Roehampton';
      if (titleEl) titleEl.value = 'B.S. (Hons) in Computer Science';
      if (catEl) catEl.value = 'Higher Education';
      if (timeEl) timeEl.value = '2023 - 2026';
      if (descEl) descEl.value = '• In-depth study of algorithms, software design patterns, distributed cloud systems, and responsive full-stack applications.\n• Advanced research and project work focusing on high-performance modern user interfaces.';
    } else if (type === 'teaching') {
      if (instEl) instEl.value = 'IT4Kids Academy';
      if (titleEl) titleEl.value = 'IT Instructor / Coding Teacher';
      if (catEl) catEl.value = 'Mentorship';
      if (timeEl) timeEl.value = '2026 - Present';
      if (descEl) descEl.value = '• Teaching basic programming and computer skills to children, guiding hands-on coding activities.\n• Breaking down complex technical concepts into intuitive, engaging lessons.';
    } else if (type === 'freelance') {
      if (instEl) instEl.value = 'Independent Developer';
      if (titleEl) titleEl.value = 'Freelance Web Developer';
      if (catEl) catEl.value = 'Freelance';
      if (timeEl) timeEl.value = '2024 - Present';
      if (descEl) descEl.value = '• Developing tailored frontend web solutions, client landing pages, and interactive web applications.\n• Delivering pixel-perfect, accessible, and responsive user experiences.';
    }

    if (instEl) instEl.focus();
    showToast('Applied preset template! You can now adjust details.');
  };

  // Clone an existing entry to the Quick Add form
  window.cloneJourney = async function (id) {
    try {
      const res = await fetch('/api/journey');
      if (res.ok) {
        const items = await res.json();
        const j = items.find((item) => item.id === id);
        if (j) {
          const instEl = document.getElementById('quick-journey-institution');
          const titleEl = document.getElementById('quick-journey-title');
          const catEl = document.getElementById('quick-journey-category');
          const timeEl = document.getElementById('quick-journey-time');
          const descEl = document.getElementById('quick-journey-desc');

          if (instEl) instEl.value = j.institution || '';
          if (titleEl) titleEl.value = j.title || '';
          if (catEl && j.category) catEl.value = j.category;
          if (timeEl) timeEl.value = j.time_period || '';
          if (descEl) descEl.value = j.description || '';

          // Scroll to quick form
          const quickForm = document.getElementById('quick-journey-form');
          if (quickForm) {
            quickForm.scrollIntoView({ behavior: 'smooth' });
          }
          if (instEl) instEl.focus();
          showToast('Loaded into Quick Add form as template!');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Quick Journey Form Submission
  const quickJourneyForm = document.getElementById('quick-journey-form');
  if (quickJourneyForm) {
    quickJourneyForm.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = quickJourneyForm.querySelector('button[type="submit"]');

      const payload = {
        institution: (document.getElementById('quick-journey-institution') ? document.getElementById('quick-journey-institution').value.trim() : ''),
        title: document.getElementById('quick-journey-title').value.trim(),
        category: (document.getElementById('quick-journey-category') ? document.getElementById('quick-journey-category').value : 'Experience'),
        time_period: document.getElementById('quick-journey-time').value.trim(),
        description: document.getElementById('quick-journey-desc').value.trim()
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
      }

      try {
        const res = await authFetch('/api/admin/journey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast('Timeline entry added successfully!');
          quickJourneyForm.reset();
          loadJourneyData();
        } else {
          showToast('Failed to add timeline entry.', 'error');
        }
      } catch (err) {
        showToast('Error saving timeline entry.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add To Timeline Now';
        }
      }
    };
  }

  window.openAddJourneyModal = function () {
    const journeyForm = document.getElementById('journey-form');
    if (journeyForm) journeyForm.reset();
    document.getElementById('journey-id').value = '';
    document.getElementById('journey-modal-title').textContent = 'Add Journey Entry';
    document.getElementById('journey-modal').style.display = 'flex';
  };

  window.editJourney = async function (id) {
    const res = await fetch('/api/journey');
    if (res.ok) {
      const items = await res.json();
      const j = items.find((item) => item.id === id);
      if (j) {
        document.getElementById('journey-id').value = j.id;
        if (document.getElementById('journey-institution')) {
          document.getElementById('journey-institution').value = j.institution || '';
        }
        document.getElementById('journey-title').value = j.title || '';
        if (document.getElementById('journey-category') && j.category) {
          document.getElementById('journey-category').value = j.category;
        }
        document.getElementById('journey-time').value = j.time_period || '';
        document.getElementById('journey-description').value = j.description || '';

        document.getElementById('journey-modal-title').textContent = 'Edit Journey Entry';
        document.getElementById('journey-modal').style.display = 'flex';
      }
    }
  };

  const journeyForm = document.getElementById('journey-form');
  if (journeyForm) {
    journeyForm.onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('journey-id').value;
      const submitBtn = journeyForm.querySelector('button[type="submit"]');

      const payload = {
        institution: (document.getElementById('journey-institution') ? document.getElementById('journey-institution').value.trim() : ''),
        title: document.getElementById('journey-title').value.trim(),
        category: (document.getElementById('journey-category') ? document.getElementById('journey-category').value : 'Experience'),
        time_period: document.getElementById('journey-time').value.trim(),
        description: document.getElementById('journey-description').value.trim()
      };

      const isEdit = !!id;
      const url = isEdit ? `/api/admin/journey/${id}` : '/api/admin/journey';
      const method = isEdit ? 'PUT' : 'POST';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      }

      try {
        const res = await authFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast(`Journey entry ${isEdit ? 'updated' : 'added'} successfully!`);
          document.getElementById('journey-modal').style.display = 'none';
          loadJourneyData();
        } else {
          showToast(`Failed to ${isEdit ? 'update' : 'add'} journey entry.`, 'error');
        }
      } catch (err) {
        showToast('Error saving journey entry.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save Journey Entry';
        }
      }
    };
  }

  window.deleteJourney = async function (id) {
    if (!confirm('Delete this journey entry?')) return;
    try {
      const res = await authFetch(`/api/admin/journey/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Journey entry deleted!');
        loadJourneyData();
      } else {
        showToast('Failed to delete entry.', 'error');
      }
    } catch (err) {
      showToast('Error deleting entry.', 'error');
    }
  };

  // ==========================================
  // 8. Reviews Manager
  // ==========================================
  async function loadReviewsData() {
    const tbody = document.getElementById('reviews-tbody');
    if (!tbody) return;

    try {
      const res = await authFetch('/api/admin/reviews');
      if (res.ok) {
        const reviews = await res.json();
        tbody.innerHTML = '';

        const metricEl = document.getElementById('metric-reviews-count');
        if (metricEl) metricEl.textContent = reviews.length;

        if (reviews.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No reviews submitted yet.</td></tr>';
          return;
        }

        reviews.forEach((r) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${r.project_title || 'Project #' + r.project_id}</td>
            <td>${r.reviewer_name}</td>
            <td>${'⭐'.repeat(r.rating || 5)}</td>
            <td>${r.comment}</td>
            <td>
              <button class="delete-btn" style="padding: 0.5rem 1rem; border-radius: 0.5rem;" onclick="deleteReview(${r.id})">
                <i class="fas fa-trash"></i> Delete
              </button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  }

  window.deleteReview = async function (id) {
    if (!confirm('Delete this review?')) return;
    try {
      const res = await authFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Review deleted successfully!');
        loadReviewsData();
      } else {
        showToast('Failed to delete review.', 'error');
      }
    } catch (err) {
      showToast('Error deleting review.', 'error');
    }
  };

  // ==========================================
  // 9. Messages Manager
  // ==========================================
  async function loadMessagesData() {
    const tbody = document.getElementById('messages-tbody');
    if (!tbody) return;

    try {
      const res = await authFetch('/api/admin/messages');
      if (res.ok) {
        const messages = await res.json();
        tbody.innerHTML = '';

        const metricEl = document.getElementById('metric-messages-count');
        if (metricEl) metricEl.textContent = messages.length;

        if (messages.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No contact messages received yet.</td></tr>';
          return;
        }

        messages.forEach((m) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${m.name}</td>
            <td><a href="mailto:${m.email}" style="color: var(--main-color);">${m.email}</a></td>
            <td>${m.phone || '-'}</td>
            <td>${m.subject}</td>
            <td style="max-width: 300px; white-space: pre-wrap;">${m.message}</td>
            <td>
              <button class="delete-btn" style="padding: 0.5rem 1rem; border-radius: 0.5rem;" onclick="deleteMessage(${m.id})">
                <i class="fas fa-trash"></i> Delete
              </button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  window.deleteMessage = async function (id) {
    if (!confirm('Delete this contact message?')) return;
    try {
      const res = await authFetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Message deleted successfully!');
        loadMessagesData();
      } else {
        showToast('Failed to delete message.', 'error');
      }
    } catch (err) {
      showToast('Error deleting message.', 'error');
    }
  };

  // Toast Notification
  window.showToast = function (message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = type === 'error' ? 'error' : 'success';
    toast.style.display = 'block';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 3500);
  };
});
