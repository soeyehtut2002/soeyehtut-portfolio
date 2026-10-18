/**
 * Soe Ye Htut - Main Portfolio Client Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // Light / Dark Theme Switcher (Default: Clean Modern Light Mode)
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      if (themeIcon) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
      }
    } else {
      document.body.classList.remove('dark-theme');
      if (themeIcon) {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
      }
    }
  }

  // Default theme is Clean Modern Light
  const savedTheme = localStorage.getItem('portfolioTheme') || 'light';
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-theme');
      const nextTheme = isDark ? 'light' : 'dark';
      applyTheme(nextTheme);
      localStorage.setItem('portfolioTheme', nextTheme);
    });
  }

  // Mobile Menu Toggle
  const menuIcon = document.querySelector("#menu-icon");
  const navbar = document.querySelector(".navbar");

  if (menuIcon && navbar) {
    menuIcon.onclick = () => {
      menuIcon.classList.toggle("fa-times");
      navbar.classList.toggle("active");
    };
  }

  // Active Navigation & Sticky Header on Scroll
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll("header nav a");
  const header = document.querySelector(".header");

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;

    // Sticky navbar
    if (header) {
      header.classList.toggle("sticky", scrollY > 80);
    }

    // Scroll active link
    sections.forEach((sec) => {
      const top = scrollY;
      const offset = sec.offsetTop - 150;
      const height = sec.offsetHeight;
      const id = sec.getAttribute("id");

      if (top >= offset && top < offset + height) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
          const targetNav = document.querySelector(`header nav a[href*="${id}"]`);
          if (targetNav) targetNav.classList.add("active");
        });
      }
    });

    // Close mobile menu on scroll
    if (menuIcon && navbar) {
      menuIcon.classList.remove("fa-times");
      navbar.classList.remove("active");
    }
  });

  // Close mobile navbar on nav link click
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (menuIcon && navbar) {
        menuIcon.classList.remove("fa-times");
        navbar.classList.remove("active");
      }
    });
  });

  // Scroll Reveal Intersection Observer
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.12
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show-animate');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  function observeElements() {
    const elementsToReveal = document.querySelectorAll(
      '.heading, .about-content h2, .about-content h3, .about-content p, .service-box, .timeline-container, .skill-item, .soft-skill-box, .portfolio-box, .contact form .input-box input, .contact form textarea, .contact form .btn'
    );
    elementsToReveal.forEach((el) => {
      if (!el.classList.contains('show-animate')) {
        revealObserver.observe(el);
      }
    });
  }

  // Typewriter Effect for Hero Roles
  let typewriterTimeout = null;
  function startTypewriter(element, roles) {
    if (!element || !roles || roles.length === 0) return;
    if (typewriterTimeout) clearTimeout(typewriterTimeout);
    if (roles.length === 1) {
      element.textContent = roles[0];
      return;
    }
    let roleIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    function tick() {
      const currentRole = roles[roleIdx];
      if (isDeleting) {
        charIdx--;
        element.textContent = currentRole.substring(0, charIdx);
        if (charIdx <= 0) {
          isDeleting = false;
          roleIdx = (roleIdx + 1) % roles.length;
          typewriterTimeout = setTimeout(tick, 400);
          return;
        }
        typewriterTimeout = setTimeout(tick, 60);
      } else {
        charIdx++;
        element.textContent = currentRole.substring(0, charIdx);
        if (charIdx === currentRole.length) {
          isDeleting = true;
          typewriterTimeout = setTimeout(tick, 2200);
          return;
        }
        typewriterTimeout = setTimeout(tick, 110);
      }
    }
    tick();
  }

  // Portfolio State & Dynamic Initialization
  let allProjects = [];

  async function initPortfolio() {
    // 1. Fetch Bio & Global Section Details
    try {
      const res = await fetch('/api/bio');
      if (res.ok) {
        const bio = await res.json();
        if (bio.name) {
          // Home / Hero Elements
          const homeGreeting = document.getElementById('home-greeting');
          const homeName = document.getElementById('home-name');
          const homeTitle = document.getElementById('home-title');
          const homeDesc = document.getElementById('home-desc');
          const homeImg = document.getElementById('home-img');
          const cvBtn = document.getElementById('cv-download-btn');

          if (homeGreeting) homeGreeting.textContent = bio.greeting || "Hello, It's Me";
          if (homeName) homeName.textContent = bio.name;
          if (homeDesc) homeDesc.textContent = bio.description;
          if (homeImg && bio.avatar_url) homeImg.src = bio.avatar_url;

          // Animated roles in Hero
          const roles = (bio.roles || bio.title || "Frontend Developer").split(',').map(r => r.trim()).filter(Boolean);
          if (homeTitle) startTypewriter(homeTitle, roles);

          // Social media links
          const socials = [
            { id: 'social-facebook', url: bio.social_facebook },
            { id: 'social-twitter', url: bio.social_twitter },
            { id: 'social-instagram', url: bio.social_instagram },
            { id: 'social-linkedin', url: bio.social_linkedin },
            { id: 'social-github', url: bio.social_github }
          ];
          socials.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) {
              if (s.url && s.url.trim() !== '') {
                el.href = s.url;
                el.style.display = 'inline-flex';
              } else {
                el.style.display = 'none';
              }
            }
          });

          // CV button
          if (cvBtn) {
            const cvPath = bio.cv_url || 'cv/SoeYeHtut-CV.pdf';
            cvBtn.href = cvPath;
            cvBtn.style.display = 'inline-flex';
          }

          // About Section Elements
          const aboutImg = document.getElementById('about-img');
          const aboutTitle = document.getElementById('about-title');
          const aboutDesc = document.getElementById('about-desc');
          if (aboutImg && bio.about_image_url) aboutImg.src = bio.about_image_url;
          if (aboutTitle) aboutTitle.textContent = bio.about_subtitle || bio.title;
          if (aboutDesc) aboutDesc.textContent = bio.about_description || bio.description;

          // About Stats
          const s1Num = document.getElementById('stat1-number');
          const s1Lbl = document.getElementById('stat1-label');
          const s2Num = document.getElementById('stat2-number');
          const s2Lbl = document.getElementById('stat2-label');
          const s3Num = document.getElementById('stat3-number');
          const s3Lbl = document.getElementById('stat3-label');
          if (s1Num) s1Num.textContent = bio.stat1_number || '3+';
          if (s1Lbl) s1Lbl.textContent = bio.stat1_label || 'Featured Projects';
          if (s2Num) s2Num.textContent = bio.stat2_number || '100%';
          if (s2Lbl) s2Lbl.textContent = bio.stat2_label || 'Dedication';
          if (s3Num) s3Num.textContent = bio.stat3_number || '24/7';
          if (s3Lbl) s3Lbl.textContent = bio.stat3_label || 'Eager to Learn';

          // Contact Section Details
          const cardEmail = document.getElementById('card-email');
          const cardPhone = document.getElementById('card-phone');
          const cardLoc = document.getElementById('card-location');
          const dispEmail = document.getElementById('contact-display-email');
          const dispPhone = document.getElementById('contact-display-phone');
          const dispLoc = document.getElementById('contact-display-location');

          if (bio.contact_email && dispEmail) {
            dispEmail.textContent = bio.contact_email;
            dispEmail.href = `mailto:${bio.contact_email}`;
            if (cardEmail) cardEmail.style.display = 'flex';
          }
          if (bio.contact_phone && dispPhone) {
            dispPhone.textContent = bio.contact_phone;
            dispPhone.href = `tel:${bio.contact_phone}`;
            if (cardPhone) cardPhone.style.display = 'flex';
          }
          if (bio.contact_location && dispLoc) {
            dispLoc.textContent = bio.contact_location;
            if (cardLoc) cardLoc.style.display = 'flex';
          }

          // Footer Text
          const footerEl = document.getElementById('footer-text');
          if (footerEl && bio.footer_text) {
            footerEl.textContent = bio.footer_text;
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch bio:", err);
    }

    // 2. Fetch Projects
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        allProjects = await res.json();
        renderProjects('all');
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }

    // 3. Fetch Section Visibility & Title Settings
    try {
      const res = await fetch('/api/sections');
      if (res.ok) {
        const sectionsList = await res.json();
        sectionsList.forEach((sec) => {
          const secEl = document.getElementById(sec.section_id);
          const navLink = document.querySelector(`header nav a[href="#${sec.section_id}"]`);
          if (sec.is_visible) {
            if (secEl) secEl.style.display = '';
            if (navLink) navLink.style.display = '';
          } else {
            if (secEl) secEl.style.display = 'none';
            if (navLink) navLink.style.display = 'none';
          }

          // Update section heading if title provided
          if (secEl && sec.title) {
            const heading = secEl.querySelector('.heading');
            if (heading) {
              const words = sec.title.split(' ');
              if (words.length > 1) {
                const lastWord = words.pop();
                heading.innerHTML = `${words.join(' ')} <span>${lastWord}</span>`;
              } else {
                heading.innerHTML = `<span>${sec.title}</span>`;
              }
            }
          }
        });
      }
    } catch (err) {
      console.error("Failed to fetch section settings:", err);
    }

    // 4. Fetch Services
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const services = await res.json();
        const container = document.querySelector('.services-container');
        if (container && services.length > 0) {
          container.innerHTML = '';
          services.forEach((s, idx) => {
            const card = document.createElement('div');
            card.className = 'service-box';
            card.style.setProperty('--i', idx + 1);
            card.innerHTML = `
              <i class="${s.icon || 'fas fa-code'}"></i>
              <h3>${s.title}</h3>
              <p>${s.description}</p>
            `;
            container.appendChild(card);
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    }

    // 5. Fetch Technical Skills
    try {
      const res = await fetch('/api/skills');
      if (res.ok) {
        const skills = await res.json();
        const container = document.querySelector('.skills-container');
        if (container && skills.length > 0) {
          container.innerHTML = '';
          skills.forEach((sk, idx) => {
            const card = document.createElement('div');
            card.className = 'skill-item';
            card.style.setProperty('--i', idx + 1);
            const brandColor = sk.color || '#00f2fe';
            card.innerHTML = `
              <div class="skill-header">
                <span class="skill-percent" style="background: ${brandColor}; color: ${brandColor === '#F7DF1E' ? '#0b0f17' : '#fff'};">${sk.percentage || 80}%</span>
              </div>
              <i class="${sk.icon || 'fas fa-code'} skill-icon" style="color: ${brandColor};"></i>
              <span class="skill-name">${sk.name}</span>
              <div class="skill-bar">
                <div class="skill-fill" style="width: ${sk.percentage || 80}%; background: ${brandColor};"></div>
              </div>
            `;
            // Hover glow matching specific color
            card.addEventListener('mouseenter', () => {
              card.style.borderColor = brandColor;
              card.style.boxShadow = `0 15px 30px ${brandColor}40`;
            });
            card.addEventListener('mouseleave', () => {
              card.style.borderColor = '';
              card.style.boxShadow = '';
            });
            container.appendChild(card);
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    }

    // 6. Fetch Soft Skills
    try {
      const res = await fetch('/api/soft-skills');
      if (res.ok) {
        const softSkills = await res.json();
        const container = document.querySelector('.soft-skills-container');
        if (container && softSkills.length > 0) {
          container.innerHTML = '';
          softSkills.forEach((sf, idx) => {
            const card = document.createElement('div');
            card.className = 'soft-skill-box';
            card.style.setProperty('--i', idx + 1);
            card.innerHTML = `
              <i class="${sf.icon || 'fas fa-comments'}"></i>
              <h3>${sf.title}</h3>
              <p>${sf.description}</p>
            `;
            container.appendChild(card);
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch soft skills:", err);
    }

  // Helper to parse years from time period strings for chronological sorting (Oldest -> Newest)
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

      // Oldest start year first (e.g. 2021 before 2024, 2026 last)
      if (aDates.start !== bDates.start) {
        return aDates.start - bDates.start;
      }
      // If same start year, earlier end year first
      if (aDates.end !== bDates.end) {
        return aDates.end - bDates.end;
      }
      return (a.id || 0) - (b.id || 0);
    });
  }

  function formatJourneyItem(item) {
    let rawTitle = (item.title || '').trim();
    let institution = (item.institution || '').trim();
    let category = (item.category || '').trim();
    let icon = (item.icon || '').trim();
    let role = rawTitle;

    // Intelligent extraction of institution / organization if not explicitly supplied
    if (!institution) {
      if (rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        role = parts[0].trim();
        institution = parts.slice(1).join(' - ').trim();
      } else if (rawTitle.includes(' at ')) {
        const parts = rawTitle.split(' at ');
        role = parts[0].trim();
        institution = parts.slice(1).join(' at ').trim();
      } else if (rawTitle.includes(' | ')) {
        const parts = rawTitle.split(' | ');
        role = parts[0].trim();
        institution = parts.slice(1).join(' | ').trim();
      } else if (/University of Roehampton/i.test(rawTitle)) {
        institution = 'University of Roehampton';
      } else if (/Higher Diploma In Software Engineering/i.test(rawTitle)) {
        institution = 'Higher Diploma In Software Engineering';
        role = 'Applied Software Engineering Diploma';
      } else if (/Lithan/i.test(rawTitle)) {
        institution = 'Lithan Academy / EduCLaaS';
      } else if (/IT4Kids/i.test(rawTitle)) {
        institution = 'IT4Kids Academy';
      }
    }

    // Fallback if institution and role are identical
    if (institution && role.toLowerCase() === institution.toLowerCase()) {
      if (/Diploma/i.test(role)) {
        role = 'Applied Software Engineering Diploma';
      } else {
        role = 'Academic & Professional Program';
      }
    }

    // Auto-detect category
    if (!category) {
      const combined = (role + ' ' + institution).toLowerCase();
      if (combined.includes('university') || combined.includes('degree') || combined.includes('bachelor') || combined.includes('b.s.') || combined.includes('roehampton')) {
        category = 'Higher Education';
      } else if (combined.includes('diploma') || combined.includes('academy') || combined.includes('training')) {
        category = 'Specialized Diploma';
      } else if (combined.includes('teacher') || combined.includes('instructor') || combined.includes('it4kids') || combined.includes('mentor')) {
        category = 'Mentorship';
      } else if (combined.includes('freelance')) {
        category = 'Freelance';
      } else {
        category = 'Experience';
      }
    }

    // Auto-detect icon
    if (!icon) {
      const combined = (role + ' ' + institution + ' ' + category).toLowerCase();
      if (combined.includes('university') || combined.includes('roehampton') || combined.includes('college')) {
        icon = 'fas fa-university';
      } else if (combined.includes('diploma') || combined.includes('degree') || combined.includes('school') || combined.includes('academy') || combined.includes('education')) {
        icon = 'fas fa-graduation-cap';
      } else if (combined.includes('instructor') || combined.includes('teacher') || combined.includes('kids') || combined.includes('mentor')) {
        icon = 'fas fa-chalkboard-teacher';
      } else if (combined.includes('freelance') || combined.includes('developer') || combined.includes('software') || combined.includes('engineer') || combined.includes('web')) {
        icon = 'fas fa-laptop-code';
      } else if (combined.includes('certificate') || combined.includes('award')) {
        icon = 'fas fa-award';
      } else {
        icon = 'fas fa-building';
      }
    }

    return {
      role: role || rawTitle,
      institution: institution || '',
      category,
      icon,
      timePeriod: item.time_period || '',
      description: item.description || ''
    };
  }

  function getCategoryIcon(cat) {
    const c = (cat || '').toLowerCase();
    if (c.includes('education') || c.includes('university')) return 'fas fa-graduation-cap';
    if (c.includes('diploma') || c.includes('training')) return 'fas fa-award';
    if (c.includes('freelance')) return 'fas fa-laptop-code';
    if (c.includes('mentor') || c.includes('teach')) return 'fas fa-chalkboard-teacher';
    return 'fas fa-briefcase';
  }

  function formatTimelineDescription(desc) {
    if (!desc) return '';
    const lines = desc.split('\n').map(l => l.trim()).filter(Boolean);
    const hasBullets = lines.some(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'));
    if (hasBullets) {
      const lis = lines.map(l => {
        const text = l.replace(/^[•\-*]\s*/, '');
        return `<li><span class="bullet-dot"></span><span class="bullet-text">${text}</span></li>`;
      }).join('');
      return `<ul class="timeline-bullets">${lis}</ul>`;
    }
    return `<p class="timeline-desc-p">${desc}</p>`;
  }

  // 7. Fetch Journey Timeline Items (Chronological: Oldest -> Newest)
  try {
    const res = await fetch('/api/journey');
    if (res.ok) {
      const rawItems = await res.json();
      const journeyItems = sortJourneyChronological(rawItems);
      const timeline = document.getElementById('journey-timeline');
      if (timeline && journeyItems.length > 0) {
        timeline.innerHTML = '';
        journeyItems.forEach((rawItem, index) => {
          const item = formatJourneyItem(rawItem);
          const alignClass = index % 2 === 0 ? 'left' : 'right';
          const container = document.createElement('div');
          container.className = `timeline-container ${alignClass}`;
          
          const categorySlug = item.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
          
          container.innerHTML = `
            <div class="timeline-dot">
              <div class="timeline-dot-inner"></div>
            </div>
            <div class="timeline-content">
              <!-- Top Meta Bar: Time Period & Category Tag -->
              <div class="timeline-meta-bar">
                ${item.timePeriod ? `<span class="timeline-date"><i class="fas fa-calendar-alt"></i>${item.timePeriod}</span>` : ''}
                <span class="timeline-category-tag category-${categorySlug}">
                  <i class="${getCategoryIcon(item.category)}"></i> ${item.category}
                </span>
              </div>

              <!-- PROMINENT HIGHLIGHT: Institution / School / Training Center / Company -->
              ${item.institution ? `
                <div class="timeline-institution-card">
                  <div class="timeline-institution-badge">
                    <div class="timeline-org-icon-wrapper">
                      <i class="${item.icon}"></i>
                    </div>
                    <div class="timeline-org-details">
                      <span class="timeline-org-label">Institution / Organization</span>
                      <span class="timeline-org-name">${item.institution}</span>
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- Degree / Role Title -->
              <h3 class="timeline-role-title">${item.role}</h3>

              <!-- Description & Key Highlights -->
              <div class="timeline-body-text">
                ${formatTimelineDescription(item.description)}
              </div>
            </div>
          `;
          timeline.appendChild(container);
        });
      }
    }
  } catch (err) {
    console.error("Failed to fetch journey timeline:", err);
  }

  observeElements();
}

  // Helper to safely format external project URL (e.g. "kasaryar.com" -> "https://kasaryar.com")
  function formatExternalUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed || trimmed === '#' || trimmed.startsWith('javascript:')) return null;
    if (!/^https?:\/\//i.test(trimmed)) {
      return 'https://' + trimmed;
    }
    return trimmed;
  }

  // Render Projects Grid
  function renderProjects(filter) {
    const container = document.getElementById('portfolio-container');
    if (!container) return;

    container.innerHTML = '';
    const filtered = allProjects.filter((p) => filter === 'all' || p.type === filter);

    if (filtered.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; font-size: 1.8rem; color: #94a3b8; padding: 5rem 0;">No projects in this category yet.</div>`;
      return;
    }

    filtered.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'portfolio-box';
      card.style.opacity = '0';
      card.style.setProperty('--i', idx + 1);

      const defaultImage = 'image/image/home-img.png';
      const imageUrl = p.image_url || defaultImage;
      const liveUrl = formatExternalUrl(p.project_url);

      card.innerHTML = `
        <div class="portfolio-box-img-wrapper">
          <img src="${imageUrl}" alt="${p.title}" loading="lazy" onerror="this.onerror=null;this.src='image/image/home-img.png';" />
        </div>
        <div class="portfolio-layer">
          <h4>${p.title}</h4>
          <p>${p.description || ''}</p>
          <div class="portfolio-actions">
            ${liveUrl ? `
              <a href="${liveUrl}" target="_blank" rel="noopener noreferrer" class="icon-btn" title="Visit Live Site">
                <i class="fas fa-external-link-alt"></i>
              </a>
            ` : ''}
            <button class="btn btn-secondary project-details-btn" data-id="${p.id}">
              <i class="fas fa-info-circle"></i> Details
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    // Attach click handlers to project details buttons
    container.querySelectorAll('.project-details-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const projId = parseInt(btn.getAttribute('data-id'));
        openProjectDetailsModal(projId);
      });
    });

    observeElements();
  }

  // Tab Filtering
  document.querySelectorAll('.portfolio-tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.portfolio-tab').forEach((t) => t.classList.remove('active'));
      e.target.classList.add('active');
      const filter = e.target.getAttribute('data-filter');
      renderProjects(filter);
    });
  });

  // Project Details Modal Management
  const projectDetailsModal = document.getElementById('project-details-modal');
  const closeProjectDetailsModalBtn = document.getElementById('close-project-details-modal');
  const submitReviewForm = document.getElementById('submit-review-form');

  if (closeProjectDetailsModalBtn && projectDetailsModal) {
    closeProjectDetailsModalBtn.onclick = () => {
      projectDetailsModal.style.display = 'none';
    };

    window.onclick = (e) => {
      if (e.target === projectDetailsModal) {
        projectDetailsModal.style.display = 'none';
      }
    };
  }

  window.openProjectDetailsModal = async function (projectId) {
    const project = allProjects.find((pro) => pro.id === projectId);
    if (!project || !projectDetailsModal) return;

    document.getElementById('modal-project-title').textContent = project.title;

    const typeBadge = document.getElementById('modal-project-type');
    if (typeBadge) {
      typeBadge.textContent = project.type || 'Project';
    }

    const imgEl = document.getElementById('modal-project-img');
    if (imgEl) {
      imgEl.src = project.image_url || 'image/image/home-img.png';
      imgEl.alt = project.title;
      imgEl.onerror = () => { imgEl.src = 'image/image/home-img.png'; };
    }

    const linkEl = document.getElementById('modal-project-link');
    if (linkEl) {
      const validLiveUrl = formatExternalUrl(project.project_url);
      if (validLiveUrl) {
        linkEl.href = validLiveUrl;
        linkEl.style.display = 'inline-flex';
      } else {
        linkEl.href = '#';
        linkEl.style.display = 'none';
      }
    }

    const descEl = document.getElementById('modal-project-desc');
    if (descEl) {
      descEl.textContent = project.description || '';
    }

    const reviewProjIdEl = document.getElementById('review-project-id');
    if (reviewProjIdEl) reviewProjIdEl.value = projectId;

    projectDetailsModal.style.display = 'flex';
    loadReviewsForProject(projectId);
  };

  async function loadReviewsForProject(projectId) {
    const container = document.getElementById('reviews-list-container');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; font-size: 1.4rem; color:#94a3b8; padding: 2rem;">Loading reviews...</div>';

    try {
      const res = await fetch(`/api/projects/${projectId}/reviews`);
      if (res.ok) {
        const reviews = await res.json();
        container.innerHTML = '';
        if (reviews.length === 0) {
          container.innerHTML = '<div style="text-align: center; font-size: 1.4rem; color:#94a3b8; padding: 2rem;">No reviews yet. Be the first to review!</div>';
          return;
        }

        reviews.forEach((r) => {
          const stars = '⭐'.repeat(r.rating || 5);
          const div = document.createElement('div');
          div.className = 'review-item';
          div.innerHTML = `
            <div class="review-meta">
              <span class="reviewer-name">${r.reviewer_name}</span>
              <span class="reviewer-stars">${stars}</span>
            </div>
            <div class="review-comment">${r.comment}</div>
          `;
          container.appendChild(div);
        });
      }
    } catch (err) {
      container.innerHTML = '<div style="text-align: center; font-size: 1.4rem; color:#ef4444; padding: 2rem;">Failed to load reviews.</div>';
    }
  }

  // Submit Review Form
  if (submitReviewForm) {
    submitReviewForm.onsubmit = async (e) => {
      e.preventDefault();
      const projectId = document.getElementById('review-project-id').value;
      const submitBtn = submitReviewForm.querySelector('button[type="submit"]');

      const payload = {
        reviewer_name: document.getElementById('reviewer-name').value,
        rating: parseInt(document.getElementById('reviewer-rating').value),
        comment: document.getElementById('reviewer-comment').value
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
      }

      try {
        const res = await fetch(`/api/projects/${projectId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast('Review submitted successfully!');
          submitReviewForm.reset();
          loadReviewsForProject(projectId);
        } else {
          showToast('Failed to submit review.', 'error');
        }
      } catch (err) {
        showToast('Network error submitting review.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Review';
        }
      }
    };
  }

  // Contact Form Submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('input[type="submit"], button[type="submit"]');

      const payload = {
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email').value,
        phone: document.getElementById('contact-phone').value,
        subject: document.getElementById('contact-subject').value,
        message: document.getElementById('contact-message').value
      };

      const originalVal = submitBtn ? submitBtn.value : 'Send Message';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.value = 'Sending...';
      }

      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast('Message sent successfully! I will contact you soon.');
          contactForm.reset();
        } else {
          showToast('Failed to send message. Please try again.', 'error');
        }
      } catch (err) {
        showToast('Network error sending message.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.value = originalVal;
        }
      }
    };
  }

  // Toast Notification Function
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

  // Initialize Portfolio Data
  initPortfolio();
});
