/**
 * CatchItUp — Main Application Controller & SaaS Page Router
 */

import { WhatsAppParser } from './parser/whatsappParser.js';
import { HeuristicExtractor } from './analyzer/heuristicExtractor.js';
import { LocalAIAdapter } from './ai/localAIAdapter.js';
import { AuthManager } from './auth/authManager.js';
import { ChartRenderer } from './components/chartRenderer.js';

class CatchItUpApp {
  constructor() {
    this.auth = new AuthManager();
    this.ai = new LocalAIAdapter();

    this.loadedFiles = [];
    this.allMessages = [];
    this.filteredMessages = [];
    this.categorized = { urgent: [], announcements: [], decisions: [], tasks: [], questions: [], events: [], mentions: [] };
    this.savedItems = new Map();
    this.currentReport = null;

    this.activePage = 'landing';
    this.selectedGroup = 'ALL';
    this.startDate = null;
    this.endDate = null;
    this.searchTerm = '';
    this.theme = 'dark';

    this.initDOMElements();
    this.bindEvents();
    this.initTheme();
    this.initUser();

    // Auto-load sample chats so dashboard and analyzer have rich data immediately
    this.loadInitialSampleChats();
  }

  initDOMElements() {
    // Sidebar & Top Nav
    this.appSidebar = document.getElementById('appSidebar');
    this.collapseSidebarBtn = document.getElementById('collapseSidebarBtn');
    this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    this.navItems = document.querySelectorAll('.nav-item');

    this.sidebarLogoBtn = document.getElementById('sidebarLogoBtn');
    this.topHeaderLogoBtn = document.getElementById('topHeaderLogoBtn');

    this.navLinkHome = document.getElementById('navLinkHome');
    this.navLinkFeatures = document.getElementById('navLinkFeatures');
    this.navLinkAI = document.getElementById('navLinkAI');
    this.navLinkDashboard = document.getElementById('navLinkDashboard');
    this.topSignInBtn = document.getElementById('topSignInBtn');
    this.topGetStartedBtn = document.getElementById('topGetStartedBtn');

    // Header Controls & User Profile
    this.globalSearchInput = document.getElementById('globalSearchInput');
    this.globalSearchClearBtn = document.getElementById('globalSearchClearBtn');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
    this.sidebarUserName = document.getElementById('sidebarUserName');
    this.openAuthModalBtn = document.getElementById('openAuthModalBtn');
    this.welcomeUserName = document.getElementById('welcomeUserName');

    // Global Filter Bar
    this.globalFilterBar = document.getElementById('globalFilterBar');
    this.globalGroupSelect = document.getElementById('globalGroupSelect');
    this.globalStartDateInput = document.getElementById('globalStartDateInput');
    this.globalEndDateInput = document.getElementById('globalEndDateInput');
    this.globalUserNameInput = document.getElementById('globalUserNameInput');
    this.globalResetFiltersBtn = document.getElementById('globalResetFiltersBtn');
    this.dateValidationError = document.getElementById('dateValidationError');

    // Landing Page Buttons & CTAs
    this.heroGetStartedBtn = document.getElementById('heroGetStartedBtn');
    this.heroExploreAiBtn = document.getElementById('heroExploreAiBtn');
    this.promoTryAiBtn = document.getElementById('promoTryAiBtn');
    this.finalCtaGetStartedBtn = document.getElementById('finalCtaGetStartedBtn');
    this.finalCtaExploreAiBtn = document.getElementById('finalCtaExploreAiBtn');

    this.footLinkHome = document.getElementById('footLinkHome');
    this.footLinkFeatures = document.getElementById('footLinkFeatures');
    this.footLinkAI = document.getElementById('footLinkAI');
    this.footLinkDashboard = document.getElementById('footLinkDashboard');

    // Dashboard Actions & Dropzone
    this.dashUploadBtn = document.getElementById('dashUploadBtn');
    this.myChatsUploadBtn = document.getElementById('myChatsUploadBtn');
    this.dashCatchUpBtn = document.getElementById('dashCatchUpBtn');
    this.saasDropZone = document.getElementById('saasDropZone');
    this.saasFileInput = document.getElementById('saasFileInput');

    // AI Analyzer Workspace Elements
    this.analyzerSourceSelect = document.getElementById('analyzerSourceSelect');
    this.analyzerModeSelect = document.getElementById('analyzerModeSelect');
    this.analyzerTextInput = document.getElementById('analyzerTextInput');
    this.analyzerWordCountLabel = document.getElementById('analyzerWordCountLabel');
    this.analyzerClearInputBtn = document.getElementById('analyzerClearInputBtn');
    this.analyzerSubmitBtn = document.getElementById('analyzerSubmitBtn');
    this.analyzerLoadingState = document.getElementById('analyzerLoadingState');
    this.analyzerResultsArea = document.getElementById('analyzerResultsArea');

    this.copyResultsBtn = document.getElementById('copyResultsBtn');
    this.downloadResultsBtn = document.getElementById('downloadResultsBtn');
    this.clearResultsBtn = document.getElementById('clearResultsBtn');

    this.reportSummaryText = document.getElementById('reportSummaryText');
    this.reportKeyFindingsList = document.getElementById('reportKeyFindingsList');
    this.reportTopicsList = document.getElementById('reportTopicsList');
    this.reportFactsList = document.getElementById('reportFactsList');
    this.reportInsightsList = document.getElementById('reportInsightsList');
    this.reportConclusionText = document.getElementById('reportConclusionText');

    // Modals
    this.authModal = document.getElementById('authModal');
    this.closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
    this.authForm = document.getElementById('authForm');
    this.authToggleBtn = document.getElementById('authToggleBtn');
    this.demoAuthBtn = document.getElementById('demoAuthBtn');
    this.authErrorMsg = document.getElementById('authErrorMsg');

    this.previewModal = document.getElementById('previewModal');
    this.closeModalBtn = document.getElementById('closeModalBtn');
    this.modalFileTitle = document.getElementById('modalFileTitle');
    this.modalStatsBar = document.getElementById('modalStatsBar');
    this.previewContentBox = document.getElementById('previewContentBox');
    this.btnPreviewParsed = document.getElementById('btnPreviewParsed');
    this.btnPreviewRaw = document.getElementById('btnPreviewRaw');

    // Badges
    this.navBadgeCatchUp = document.getElementById('navBadgeCatchUp');
    this.navBadgeChatsCount = document.getElementById('navBadgeChatsCount');
    this.navBadgeSaved = document.getElementById('navBadgeSaved');

    // Settings
    this.settingsUserNameInput = document.getElementById('settingsUserNameInput');
    this.saveProfileBtn = document.getElementById('saveProfileBtn');
    this.purgeDataBtn = document.getElementById('purgeDataBtn');
  }

  bindEvents() {
    // Sidebar collapse & mobile menu
    this.collapseSidebarBtn.addEventListener('click', () => {
      this.appSidebar.classList.toggle('collapsed');
    });

    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.addEventListener('click', () => {
        this.appSidebar.classList.toggle('mobile-open');
      });
    }

    // Logo Clicks & Landing Page Links
    [this.sidebarLogoBtn, this.topHeaderLogoBtn, this.navLinkHome, this.footLinkHome].forEach(btn => {
      if (btn) btn.addEventListener('click', () => {
        this.navigateToPage('landing');
        const hero = document.getElementById('heroSection');
        if (hero) hero.scrollIntoView({ behavior: 'smooth' });
      });
    });

    [this.navLinkFeatures, this.footLinkFeatures].forEach(btn => {
      if (btn) btn.addEventListener('click', () => {
        this.navigateToPage('landing');
        const feat = document.getElementById('featuresSection');
        if (feat) feat.scrollIntoView({ behavior: 'smooth' });
      });
    });

    [this.navLinkAI, this.footLinkAI, this.heroExploreAiBtn, this.promoTryAiBtn, this.finalCtaExploreAiBtn].forEach(btn => {
      if (btn) btn.addEventListener('click', () => this.navigateToPage('aianalyzer'));
    });

    [this.navLinkDashboard, this.footLinkDashboard].forEach(btn => {
      if (btn) btn.addEventListener('click', () => this.navigateToPage('dashboard'));
    });

    [this.topSignInBtn, this.openAuthModalBtn].forEach(btn => {
      if (btn) btn.addEventListener('click', () => {
        this.authModal.style.display = 'flex';
      });
    });

    [this.topGetStartedBtn, this.heroGetStartedBtn, this.finalCtaGetStartedBtn].forEach(btn => {
      if (btn) btn.addEventListener('click', () => {
        this.navigateToPage('dashboard');
      });
    });

    // Page Router
    this.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const pageId = item.dataset.page;
        this.navigateToPage(pageId);
      });
    });

    // Theme toggle
    this.themeToggleBtn.addEventListener('click', () => {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', this.theme);
    });

    // File Upload Triggers
    [this.dashUploadBtn, this.myChatsUploadBtn].forEach(btn => {
      if (btn) btn.addEventListener('click', () => this.saasFileInput.click());
    });

    if (this.saasDropZone) {
      this.saasDropZone.addEventListener('click', () => this.saasFileInput.click());
      ['dragenter', 'dragover'].forEach(name => {
        this.saasDropZone.addEventListener(name, (e) => {
          e.preventDefault();
          this.saasDropZone.style.borderColor = 'var(--accent-primary)';
        });
      });
      ['dragleave', 'drop'].forEach(name => {
        this.saasDropZone.addEventListener(name, (e) => {
          e.preventDefault();
          this.saasDropZone.style.borderColor = '';
        });
      });
      this.saasDropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files.length) this.handleFilesUpload(e.dataTransfer.files);
      });
    }

    this.saasFileInput.addEventListener('change', (e) => {
      if (e.target.files.length) this.handleFilesUpload(e.target.files);
    });

    // Global Filter Listeners
    this.globalGroupSelect.addEventListener('change', (e) => {
      this.selectedGroup = e.target.value;
      this.processData();
    });

    this.globalStartDateInput.addEventListener('change', () => this.onDateFilterChange());
    this.globalEndDateInput.addEventListener('change', () => this.onDateFilterChange());

    this.globalUserNameInput.addEventListener('input', (e) => {
      const user = this.auth.getUser();
      if (user) user.name = e.target.value;
      this.updateUserUI();
      this.processData();
    });

    this.globalSearchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase().trim();
      this.globalSearchClearBtn.style.display = this.searchTerm ? 'block' : 'none';
      this.processData();
    });

    this.globalSearchClearBtn.addEventListener('click', () => {
      this.globalSearchInput.value = '';
      this.searchTerm = '';
      this.globalSearchClearBtn.style.display = 'none';
      this.processData();
    });

    this.globalResetFiltersBtn.addEventListener('click', () => {
      this.globalGroupSelect.value = 'ALL';
      this.globalStartDateInput.value = '';
      this.globalEndDateInput.value = '';
      this.globalSearchInput.value = '';
      this.selectedGroup = 'ALL';
      this.startDate = null;
      this.endDate = null;
      this.searchTerm = '';
      this.dateValidationError.style.display = 'none';
      this.processData();
    });

    if (this.dashCatchUpBtn) {
      this.dashCatchUpBtn.addEventListener('click', () => this.navigateToPage('catchup'));
    }

    // AI Analyzer Workspace Events
    this.analyzerTextInput.addEventListener('input', () => this.updateAnalyzerWordCount());
    this.analyzerSourceSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (selected === 'custom') {
        this.analyzerTextInput.value = '';
      } else {
        const file = this.loadedFiles.find(f => f.groupName === selected);
        if (file) {
          this.analyzerTextInput.value = file.messages.map(m => `[${m.sender || 'System'}]: ${m.text}`).join('\n');
        }
      }
      this.updateAnalyzerWordCount();
    });

    this.analyzerClearInputBtn.addEventListener('click', () => {
      this.analyzerTextInput.value = '';
      this.updateAnalyzerWordCount();
      this.analyzerResultsArea.style.display = 'none';
    });

    this.analyzerSubmitBtn.addEventListener('click', () => this.runAIAnalysis());

    this.copyResultsBtn.addEventListener('click', () => {
      if (!this.currentReport) return;
      navigator.clipboard.writeText(this.currentReport.rawOutput);
      const origText = this.copyResultsBtn.textContent;
      this.copyResultsBtn.textContent = '✅ Copied!';
      setTimeout(() => { this.copyResultsBtn.textContent = origText; }, 1500);
    });

    this.downloadResultsBtn.addEventListener('click', () => {
      if (!this.currentReport) return;
      const blob = new Blob([this.currentReport.rawOutput], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `CatchItUp_Analysis_Report_${Date.now()}.txt`;
      a.click();
    });

    this.clearResultsBtn.addEventListener('click', () => {
      this.analyzerResultsArea.style.display = 'none';
      this.currentReport = null;
    });

    // Auth Modal
    this.closeAuthModalBtn.addEventListener('click', () => {
      this.authModal.style.display = 'none';
    });

    this.demoAuthBtn.addEventListener('click', () => {
      this.auth.loginDemo();
      this.updateUserUI();
      this.authModal.style.display = 'none';
    });

    this.authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmailInput').value;
      const pwd = document.getElementById('authPasswordInput').value;
      const res = this.auth.signIn(email, pwd);
      if (res.success) {
        this.updateUserUI();
        this.authModal.style.display = 'none';
      } else {
        this.authErrorMsg.textContent = res.message;
        this.authErrorMsg.style.display = 'block';
      }
    });

    // Settings Profile Save & Purge
    if (this.saveProfileBtn) {
      this.saveProfileBtn.addEventListener('click', () => {
        const user = this.auth.getUser();
        if (user) {
          user.name = this.settingsUserNameInput.value;
          this.auth.saveSession(user);
          this.updateUserUI();
          alert('Profile settings updated successfully!');
        }
      });
    }

    if (this.purgeDataBtn) {
      this.purgeDataBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to purge all imported chat data from browser memory?')) {
          this.loadedFiles = [];
          this.allMessages = [];
          this.filteredMessages = [];
          this.savedItems.clear();
          this.processData();
          alert('All chat data purged.');
        }
      });
    }

    // Modal Close
    this.closeModalBtn.addEventListener('click', () => {
      this.previewModal.style.display = 'none';
    });
  }

  initTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  initUser() {
    const user = this.auth.getUser();
    if (user) {
      this.updateUserUI();
    }
  }

  updateUserUI() {
    const user = this.auth.getUser();
    if (!user) return;

    this.sidebarUserName.textContent = user.name;
    this.sidebarUserAvatar.textContent = user.avatar;
    if (this.welcomeUserName) this.welcomeUserName.textContent = user.name;
    this.globalUserNameInput.value = user.name;
    if (this.settingsUserNameInput) this.settingsUserNameInput.value = user.name;
  }

  onDateFilterChange() {
    const startVal = this.globalStartDateInput.value;
    const endVal = this.globalEndDateInput.value;

    let start = startVal ? new Date(startVal + 'T00:00:00') : null;
    let end = endVal ? new Date(endVal + 'T23:59:59.999') : null;

    if (start && end && end < start) {
      this.dateValidationError.style.display = 'block';
      this.globalEndDateInput.value = startVal;
      end = new Date(startVal + 'T23:59:59.999');
    } else {
      this.dateValidationError.style.display = 'none';
    }

    this.startDate = start;
    this.endDate = end;
    this.processData();
  }

  handleFilesUpload(fileList) {
    const txtFiles = Array.from(fileList).filter(f => f.name.endsWith('.txt'));
    if (!txtFiles.length) {
      alert('Please upload WhatsApp text export files (.txt).');
      return;
    }

    let loadedCount = 0;
    txtFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawText = e.target.result;
        const groupData = WhatsAppParser.parseFile(rawText, file.name);
        groupData.rawText = rawText;

        const idx = this.loadedFiles.findIndex(f => f.fileName === file.name);
        if (idx > -1) {
          this.loadedFiles[idx] = groupData;
        } else {
          this.loadedFiles.push(groupData);
        }

        loadedCount++;
        if (loadedCount === txtFiles.length) {
          this.onFilesLoaded();
        }
      };
      reader.readAsText(file);
    });
  }

  async loadInitialSampleChats() {
    const sampleFiles = [
      { name: 'WhatsApp Chat - Hackathon Team.txt', path: './sample_chats/WhatsApp Chat - Hackathon Team.txt' },
      { name: 'WhatsApp Chat - Product Release.txt', path: './sample_chats/WhatsApp Chat - Product Release.txt' },
      { name: 'WhatsApp Chat - Family & Events.txt', path: './sample_chats/WhatsApp Chat - Family & Events.txt' }
    ];

    try {
      for (const s of sampleFiles) {
        const resp = await fetch(s.path);
        if (resp.ok) {
          const rawText = await resp.text();
          const groupData = WhatsAppParser.parseFile(rawText, s.name);
          groupData.rawText = rawText;
          this.loadedFiles.push(groupData);
        }
      }
      this.onFilesLoaded();
    } catch (e) {}
  }

  onFilesLoaded() {
    this.allMessages = [];
    this.loadedFiles.forEach(file => {
      this.allMessages.push(...file.messages);
    });

    // Populate Group Select dropdowns
    this.globalGroupSelect.innerHTML = '<option value="ALL">All Imported Groups</option>';
    this.analyzerSourceSelect.innerHTML = '<option value="custom">Paste Custom Text / Article / Notes</option>';

    this.loadedFiles.forEach(file => {
      const opt = document.createElement('option');
      opt.value = file.groupName;
      opt.textContent = `${file.groupName} (${file.messageCount} msgs)`;
      this.globalGroupSelect.appendChild(opt);

      const opt2 = document.createElement('option');
      opt2.value = file.groupName;
      opt2.textContent = `📁 Chat: ${file.groupName} (${file.messageCount} msgs)`;
      this.analyzerSourceSelect.appendChild(opt2);
    });

    this.navBadgeChatsCount.textContent = this.loadedFiles.length;
    this.processData();
  }

  processData() {
    const userName = this.auth.getUser() ? this.auth.getUser().name : 'Syed';

    this.filteredMessages = this.allMessages.filter(msg => {
      if (this.selectedGroup !== 'ALL' && msg.groupName !== this.selectedGroup) return false;
      if (msg.timestamp) {
        if (this.startDate && msg.timestamp < this.startDate) return false;
        if (this.endDate && msg.timestamp > this.endDate) return false;
      }
      if (this.searchTerm) {
        const txtMatch = msg.text && msg.text.toLowerCase().includes(this.searchTerm);
        const senderMatch = msg.sender && msg.sender.toLowerCase().includes(this.searchTerm);
        if (!txtMatch && !senderMatch) return false;
      }
      return true;
    });

    this.categorized = HeuristicExtractor.analyze(this.filteredMessages, userName);

    const catchUpCount = this.categorized.urgent.length + this.categorized.tasks.length + this.categorized.decisions.length;
    this.navBadgeCatchUp.textContent = catchUpCount;
    this.navBadgeSaved.textContent = this.savedItems.size;

    this.renderActivePage();
  }

  navigateToPage(pageId) {
    this.activePage = pageId;
    this.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageId);
    });

    const pages = document.querySelectorAll('.page-view');
    pages.forEach(p => p.classList.remove('active'));

    const targetPage = document.getElementById(`page${pageId.charAt(0).toUpperCase() + pageId.slice(1)}`);
    if (targetPage) targetPage.classList.add('active');

    // Show/hide filter bar based on view
    if (pageId === 'landing' || pageId === 'aianalyzer' || pageId === 'settings') {
      this.globalFilterBar.style.display = 'none';
    } else {
      this.globalFilterBar.style.display = 'block';
    }

    this.renderActivePage();
  }

  renderActivePage() {
    switch(this.activePage) {
      case 'landing': break;
      case 'dashboard': this.renderDashboard(); break;
      case 'catchup': this.renderCatchUp(); break;
      case 'mychats': this.renderMyChats(); break;
      case 'aianalyzer': break;
      case 'analytics': this.renderAnalytics(); break;
      case 'saved': this.renderSaved(); break;
      case 'settings': break;
    }
  }

  renderDashboard() {
    document.getElementById('metricTotalChats').textContent = this.loadedFiles.length;
    document.getElementById('metricTotalMessages').textContent = this.allMessages.length;
    document.getElementById('metricPeriodMsgs').textContent = this.filteredMessages.length;
    
    const importantCount = this.categorized.urgent.length + this.categorized.tasks.length + this.categorized.decisions.length;
    document.getElementById('metricImportantItems').textContent = importantCount;

    ChartRenderer.renderTimeline(document.getElementById('dashTimelineChart'), this.filteredMessages);

    const recentList = document.getElementById('dashRecentImportsList');
    recentList.innerHTML = '';

    if (!this.loadedFiles.length) {
      recentList.innerHTML = '<p class="empty-state">No chat files imported yet.</p>';
      return;
    }

    this.loadedFiles.forEach(file => {
      const item = document.createElement('div');
      item.className = 'catchup-item';
      item.innerHTML = `
        <div class="catchup-item-sender">
          <span>📁 ${this.escapeHTML(file.groupName)}</span>
          <span class="badge-tag tag-info">${file.messageCount} msgs</span>
        </div>
        <div class="catchup-item-text">
          <span>👥 ${file.senderCount} participants &bull; Date Range: ${file.startDate ? file.startDate.toLocaleDateString() : 'N/A'} - ${file.endDate ? file.endDate.toLocaleDateString() : 'N/A'}</span>
        </div>
      `;
      recentList.appendChild(item);
    });
  }

  renderCatchUp() {
    this.renderCatchUpList('catchUpUrgentList', 'catchUpUrgentCount', this.categorized.urgent);
    this.renderCatchUpList('catchUpAnnounceList', 'catchUpAnnounceCount', this.categorized.announcements);
    this.renderCatchUpList('catchUpDecisionsList', 'catchUpDecisionsCount', this.categorized.decisions);
    this.renderCatchUpList('catchUpTasksList', 'catchUpTasksCount', this.categorized.tasks);
    this.renderCatchUpList('catchUpQuestionsList', 'catchUpQuestionsCount', this.categorized.questions);
    this.renderCatchUpList('catchUpEventsList', 'catchUpEventsCount', this.categorized.events);
  }

  renderCatchUpList(containerId, badgeId, items) {
    const container = document.getElementById(containerId);
    const badge = document.getElementById(badgeId);

    badge.textContent = items.length;
    container.innerHTML = '';

    if (!items.length) {
      container.innerHTML = '<p class="empty-state">No items detected for current filters.</p>';
      return;
    }

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'catchup-item';
      const isBookmarked = this.savedItems.has(item.id);

      div.innerHTML = `
        <div class="catchup-item-sender">
          <span><strong>${this.escapeHTML(item.sender || 'System')}</strong> [${this.escapeHTML(item.groupName)}]</span>
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-right: 8px;">${item.formattedDate}</span>
            <button class="btn-icon bookmark-btn" style="background: none; border: none; cursor: pointer;">${isBookmarked ? '🔖 Saved' : '🔖 Bookmark'}</button>
          </div>
        </div>
        <div class="catchup-item-text">${this.escapeHTML(item.text)}</div>
      `;

      div.querySelector('.bookmark-btn').addEventListener('click', () => {
        if (this.savedItems.has(item.id)) {
          this.savedItems.delete(item.id);
        } else {
          this.savedItems.set(item.id, item);
        }
        this.processData();
      });

      container.appendChild(div);
    });
  }

  renderMyChats() {
    const grid = document.getElementById('myChatsGrid');
    grid.innerHTML = '';

    if (!this.loadedFiles.length) {
      grid.innerHTML = '<p class="empty-state">No chats uploaded yet.</p>';
      return;
    }

    this.loadedFiles.forEach(file => {
      const card = document.createElement('div');
      card.className = 'card-box';
      card.innerHTML = `
        <div class="card-box-header">
          <h3>📁 ${this.escapeHTML(file.groupName)}</h3>
          <span class="badge-tag tag-info">${file.messageCount} msgs</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">
          👥 ${file.senderCount} Participants<br>
          📅 ${file.startDate ? file.startDate.toLocaleDateString() : ''} - ${file.endDate ? file.endDate.toLocaleDateString() : ''}
        </p>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-sm btn-outline preview-btn">Preview File</button>
          <button class="btn btn-sm btn-danger delete-btn">Delete</button>
        </div>
      `;

      card.querySelector('.preview-btn').addEventListener('click', () => this.openPreviewModal(file));
      card.querySelector('.delete-btn').addEventListener('click', () => {
        this.loadedFiles = this.loadedFiles.filter(f => f.fileName !== file.fileName);
        this.onFilesLoaded();
      });

      grid.appendChild(card);
    });
  }

  updateAnalyzerWordCount() {
    const txt = this.analyzerTextInput.value || '';
    const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
    const chars = txt.length;
    this.analyzerWordCountLabel.textContent = `${words} words | ${chars} characters`;
  }

  async runAIAnalysis() {
    const txt = this.analyzerTextInput.value.trim();
    if (!txt && !this.filteredMessages.length) {
      alert('Please enter text or select an imported chat to analyze.');
      return;
    }

    const mode = this.analyzerModeSelect.value;
    this.analyzerLoadingState.style.display = 'flex';
    this.analyzerResultsArea.style.display = 'none';

    try {
      const report = await this.ai.analyzeContent(txt, mode, this.filteredMessages);
      this.currentReport = report;

      this.reportSummaryText.textContent = report.executiveSummary;
      
      this.reportKeyFindingsList.innerHTML = report.keyFindings.map(k => `<li>${this.escapeHTML(k)}</li>`).join('');
      this.reportTopicsList.innerHTML = report.mainTopics.map(t => `<li>${this.escapeHTML(t)}</li>`).join('');
      this.reportFactsList.innerHTML = report.importantFacts.map(f => `<li>${this.escapeHTML(f)}</li>`).join('');
      this.reportInsightsList.innerHTML = report.actionableInsights.map(a => `<li>${this.escapeHTML(a)}</li>`).join('');
      
      this.reportConclusionText.textContent = report.conclusion;

      this.analyzerLoadingState.style.display = 'none';
      this.analyzerResultsArea.style.display = 'flex';
    } catch (err) {
      this.analyzerLoadingState.style.display = 'none';
      alert('Analysis Error: ' + err.message);
    }
  }

  renderAnalytics() {
    ChartRenderer.renderTimeline(document.getElementById('analyticsTimelineChart'), this.filteredMessages);
    ChartRenderer.renderPeakHours(document.getElementById('analyticsPeakHoursChart'), this.filteredMessages);
    ChartRenderer.renderParticipantRankings(document.getElementById('analyticsParticipantsList'), this.filteredMessages);
  }

  renderSaved() {
    const container = document.getElementById('savedItemsList');
    container.innerHTML = '';

    if (!this.savedItems.size) {
      container.innerHTML = '<p class="empty-state">No saved bookmarks yet. Click "Bookmark" on any message in Catch Up to save it here.</p>';
      return;
    }

    this.savedItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'catchup-item';
      card.innerHTML = `
        <div class="catchup-item-sender">
          <span><strong>${this.escapeHTML(item.sender || 'System')}</strong> [${this.escapeHTML(item.groupName)}]</span>
          <button class="btn btn-sm btn-danger remove-saved-btn">Remove Bookmark</button>
        </div>
        <div class="catchup-item-text">${this.escapeHTML(item.text)}</div>
      `;

      card.querySelector('.remove-saved-btn').addEventListener('click', () => {
        this.savedItems.delete(item.id);
        this.renderSaved();
      });

      container.appendChild(card);
    });
  }

  openPreviewModal(fileData) {
    this.modalFileTitle.textContent = `Group Export: ${fileData.groupName}`;
    this.modalStatsBar.innerHTML = `
      <span><strong>File:</strong> ${this.escapeHTML(fileData.fileName)}</span> |
      <span><strong>Messages:</strong> ${fileData.messageCount}</span> |
      <span><strong>Participants:</strong> ${fileData.senderCount}</span>
    `;

    let previewMode = 'parsed';
    const render = () => {
      if (previewMode === 'parsed') {
        this.previewContentBox.textContent = JSON.stringify(fileData.messages.slice(0, 50), null, 2);
      } else {
        this.previewContentBox.textContent = fileData.rawText.substring(0, 4000);
      }
    };

    this.btnPreviewParsed.onclick = () => {
      previewMode = 'parsed';
      this.btnPreviewParsed.classList.add('active');
      this.btnPreviewRaw.classList.remove('active');
      render();
    };

    this.btnPreviewRaw.onclick = () => {
      previewMode = 'raw';
      this.btnPreviewRaw.classList.add('active');
      this.btnPreviewParsed.classList.remove('active');
      render();
    };

    render();
    this.previewModal.style.display = 'flex';
  }

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new CatchItUpApp();
});
