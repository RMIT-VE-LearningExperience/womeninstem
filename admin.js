console.log('🚀 Admin Dashboard loaded');

// GitHub API Configuration
const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = 'RMIT-VE-LearningExperience';
const REPO_NAME = 'dmd';
const FILE_PATH = 'wis_demo/wis.json';
const BRANCH = 'main';

// State
let githubToken = null;
let careerData = null;
let fileSHA = null;
let currentEditIndex = -1;
let allCareers = [];

// DOM Elements
const tokenSetup = document.getElementById('token-setup');
const dashboard = document.getElementById('dashboard');
const tokenInput = document.getElementById('token-input');
const saveTokenBtn = document.getElementById('save-token-btn');
const tokenError = document.getElementById('token-error');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const careerCount = document.getElementById('career-count');
const careersTbody = document.getElementById('careers-tbody');
const addCareerBtn = document.getElementById('add-career-btn');
const editPanel = document.getElementById('edit-panel');
const closePanelBtn = document.getElementById('close-panel-btn');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const searchInput = document.getElementById('search-input');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingMessage = document.getElementById('loading-message');
const toast = document.getElementById('toast');

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

function init() {
    console.log('✅ Initializing admin dashboard');

    githubToken = localStorage.getItem('github_pat');

    if (!githubToken) {
        showTokenSetup();
    } else {
        loadDashboard();
    }

    initializeEventListeners();
}

function initializeEventListeners() {
    saveTokenBtn.addEventListener('click', handleSaveToken);
    logoutBtn.addEventListener('click', handleLogout);
    addCareerBtn.addEventListener('click', handleAddCareer);
    closePanelBtn.addEventListener('click', closeEditPanel);
    cancelBtn.addEventListener('click', closeEditPanel);
    saveBtn.addEventListener('click', handleSaveCareer);
    searchInput.addEventListener('input', handleSearch);

    // Tag inputs
    document.getElementById('skill-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag('skills-container', e.target.value.trim());
            e.target.value = '';
        }
    });

    document.getElementById('education-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag('education-container', e.target.value.trim());
            e.target.value = '';
        }
    });

    document.getElementById('related-role-select').addEventListener('change', (e) => {
        if (e.target.value) {
            addTag('related-roles-container', e.target.value);
            e.target.value = '';
        }
    });

    document.getElementById('add-level-btn').addEventListener('click', () => {
        addLevel();
    });
}

// Token Management
function showTokenSetup() {
    tokenSetup.style.display = 'flex';
    dashboard.style.display = 'none';
}

function showDashboard() {
    tokenSetup.style.display = 'none';
    dashboard.style.display = 'block';
}

async function handleSaveToken() {
    const token = tokenInput.value.trim();

    if (!token) {
        showError('Please enter a token', tokenError);
        return;
    }

    githubToken = token;

    try {
        showLoading('Verifying token...');

        // Test token by fetching user info
        const user = await getUserInfo();

        // Save token to localStorage
        localStorage.setItem('github_pat', token);

        hideLoading();
        showDashboard();
        loadDashboard();

    } catch (error) {
        hideLoading();
        githubToken = null;
        showError('Invalid token or network error: ' + error.message, tokenError);
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout? Your token will be removed from this browser.')) {
        localStorage.removeItem('github_pat');
        githubToken = null;
        careerData = null;
        fileSHA = null;
        window.location.reload();
    }
}

// GitHub API Functions
async function getUserInfo() {
    const response = await fetch(`${GITHUB_API}/user`, {
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to verify token');
    }

    return await response.json();
}

async function loadCareerData() {
    const url = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to load career data from GitHub');
    }

    const data = await response.json();
    fileSHA = data.sha;
    const content = atob(data.content);
    careerData = JSON.parse(content);

    console.log('✅ Career data loaded:', careerData.roles.length, 'careers');

    return careerData;
}

async function saveCareerData(commitMessage) {
    const url = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

    // UTF-8 safe Base64 encoding (handles Unicode characters like en-dashes, curly quotes)
    const jsonString = JSON.stringify(careerData, null, 2);
    const utf8Bytes = new TextEncoder().encode(jsonString);
    const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
    const content = btoa(binaryString);

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: commitMessage || `Update careers via dashboard - ${new Date().toISOString()}`,
            content: content,
            sha: fileSHA,
            branch: BRANCH
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save changes to GitHub');
    }

    const result = await response.json();
    fileSHA = result.content.sha;

    console.log('✅ Changes saved to GitHub');

    return result;
}

// Dashboard Functions
async function loadDashboard() {
    try {
        showLoading('Loading career data...');

        // Load user info
        const user = await getUserInfo();
        userInfo.innerHTML = `
            <img src="${user.avatar_url}" alt="${user.login}" />
            <span>${user.name || user.login}</span>
        `;

        // Load career data
        await loadCareerData();
        allCareers = [...careerData.roles];

        // Display careers
        displayCareerList(allCareers);
        updateCareerCount();

        // Populate autocomplete suggestions
        populateDatalistSuggestions();

        hideLoading();

    } catch (error) {
        hideLoading();
        showToast('Error loading dashboard: ' + error.message, 'error');
        console.error('❌ Dashboard load error:', error);
    }
}

// Extract all unique skills from loaded data
function getAllSkills() {
    const skills = new Set();
    careerData.roles.forEach(career => {
        (career.core_skills || []).forEach(skill => skills.add(skill));
    });
    return Array.from(skills).sort();
}

// Extract all unique education requirements
function getAllEducation() {
    const education = new Set();
    careerData.roles.forEach(career => {
        (career.core_education || []).forEach(edu => education.add(edu));
    });
    return Array.from(education).sort();
}

// Populate datalist suggestions for autocomplete
function populateDatalistSuggestions() {
    // Skills datalist
    const skills = getAllSkills();
    let skillDatalist = document.getElementById('skill-suggestions');
    if (!skillDatalist) {
        skillDatalist = document.createElement('datalist');
        skillDatalist.id = 'skill-suggestions';
        document.body.appendChild(skillDatalist);
    }
    skillDatalist.innerHTML = skills.map(skill =>
        `<option value="${skill}">`
    ).join('');

    // Education datalist
    const education = getAllEducation();
    let eduDatalist = document.getElementById('education-suggestions');
    if (!eduDatalist) {
        eduDatalist = document.createElement('datalist');
        eduDatalist.id = 'education-suggestions';
        document.body.appendChild(eduDatalist);
    }
    eduDatalist.innerHTML = education.map(edu =>
        `<option value="${edu}">`
    ).join('');

    // Link inputs to datalists
    document.getElementById('skill-input').setAttribute('list', 'skill-suggestions');
    document.getElementById('education-input').setAttribute('list', 'education-suggestions');

    console.log(`✅ Autocomplete populated: ${skills.length} skills, ${education.length} education options`);
}

function displayCareerList(careers) {
    if (!careers || careers.length === 0) {
        careersTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #718096;">No careers found</td></tr>';
        return;
    }

    careersTbody.innerHTML = careers.map((career, index) => {
        const globalIndex = careerData.roles.findIndex(c => c.name === career.name);
        return `
            <tr>
                <td><strong>${career.name}</strong></td>
                <td>${career.salary_range}</td>
                <td>${career.work_style}</td>
                <td>${career.levels ? career.levels.length : 0}</td>
                <td>${career.core_skills ? career.core_skills.length : 0}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="editCareer(${globalIndex})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCareer(${globalIndex})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateCareerCount() {
    careerCount.textContent = `${careerData.roles.length} careers`;
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    if (!query) {
        displayCareerList(allCareers);
        return;
    }

    const filtered = allCareers.filter(career =>
        career.name.toLowerCase().includes(query) ||
        career.work_style.toLowerCase().includes(query) ||
        career.overview.toLowerCase().includes(query)
    );

    displayCareerList(filtered);
}

// Career CRUD Operations
function handleAddCareer() {
    currentEditIndex = -1;
    document.getElementById('edit-panel-title').textContent = 'Add New Career';
    clearForm();
    populateRelatedRoleOptions();
    openEditPanel();
}

window.editCareer = function(index) {
    currentEditIndex = index;
    document.getElementById('edit-panel-title').textContent = 'Edit Career';

    const career = careerData.roles[index];

    // Populate form
    document.getElementById('career-name').value = career.name || '';
    document.getElementById('salary-range').value = career.salary_range || '';
    document.getElementById('overview').value = career.overview || '';
    document.getElementById('work-style').value = career.work_style || '';
    document.getElementById('video-url').value = career.video_url || '';
    document.getElementById('person-name').value = career.person_name || '';
    document.getElementById('person-bio').value = career.person_bio || '';

    // Populate tags
    populateTags('skills-container', career.core_skills || []);
    populateTags('education-container', career.core_education || []);
    populateTags('related-roles-container', career.related_roles || []);

    // Populate levels
    populateLevels(career.levels || []);

    // Populate related role options
    populateRelatedRoleOptions(career.name);

    openEditPanel();
};

window.deleteCareer = function(index) {
    const career = careerData.roles[index];

    if (!confirm(`Are you sure you want to delete "${career.name}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    careerData.roles.splice(index, 1);
    allCareers = [...careerData.roles];

    displayCareerList(allCareers);
    updateCareerCount();

    showToast(`"${career.name}" deleted. Remember to save changes to GitHub.`, 'success');
};

async function handleSaveCareer() {
    // Get form data
    const career = {
        name: document.getElementById('career-name').value.trim(),
        salary_range: document.getElementById('salary-range').value.trim(),
        overview: document.getElementById('overview').value.trim(),
        work_style: document.getElementById('work-style').value,
        video_url: document.getElementById('video-url').value.trim(),
        person_name: document.getElementById('person-name').value.trim(),
        person_bio: document.getElementById('person-bio').value.trim(),
        core_skills: getTagValues('skills-container'),
        core_education: getTagValues('education-container'),
        related_roles: getTagValues('related-roles-container'),
        levels: getLevels()
    };

    // Validate
    const errors = validateCareer(career);
    if (errors.length > 0) {
        showValidationErrors(errors);
        return;
    }

    hideValidationErrors();

    // Update or add career
    if (currentEditIndex === -1) {
        // Adding new career
        careerData.roles.push(career);
    } else {
        // Updating existing career
        careerData.roles[currentEditIndex] = career;
    }

    allCareers = [...careerData.roles];

    // Save to GitHub
    try {
        showLoading('Saving to GitHub...');

        const action = currentEditIndex === -1 ? 'Added' : 'Updated';
        await saveCareerData(`${action} career: ${career.name}`);

        hideLoading();
        closeEditPanel();
        displayCareerList(allCareers);
        updateCareerCount();

        showToast(`Career "${career.name}" saved successfully!`, 'success');

    } catch (error) {
        hideLoading();
        showToast('Failed to save: ' + error.message, 'error');
        console.error('❌ Save error:', error);
    }
}

// Form Functions
function clearForm() {
    document.getElementById('career-name').value = '';
    document.getElementById('salary-range').value = '';
    document.getElementById('overview').value = '';
    document.getElementById('work-style').value = '';
    document.getElementById('video-url').value = '';
    document.getElementById('person-name').value = '';
    document.getElementById('person-bio').value = '';

    clearTags('skills-container');
    clearTags('education-container');
    clearTags('related-roles-container');

    document.getElementById('levels-container').innerHTML = '';

    // Add 2 empty levels
    addLevel();
    addLevel();

    hideValidationErrors();
}

function populateTags(containerId, values) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    values.forEach(value => {
        addTagElement(containerId, value);
    });
}

function clearTags(containerId) {
    document.getElementById(containerId).innerHTML = '';
}

function addTag(containerId, value) {
    if (!value) return;

    const container = document.getElementById(containerId);
    const existing = Array.from(container.querySelectorAll('.tag')).map(tag => tag.dataset.value);

    if (existing.includes(value)) {
        showToast('This item already exists', 'error');
        return;
    }

    addTagElement(containerId, value);
}

function addTagElement(containerId, value) {
    const container = document.getElementById(containerId);

    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.dataset.value = value;
    tag.innerHTML = `
        ${value}
        <button type="button" class="tag-remove" onclick="removeTag(this)">&times;</button>
    `;

    container.appendChild(tag);
}

window.removeTag = function(button) {
    button.parentElement.remove();
};

function getTagValues(containerId) {
    const container = document.getElementById(containerId);
    return Array.from(container.querySelectorAll('.tag')).map(tag => tag.dataset.value);
}

function populateRelatedRoleOptions(currentCareerName = null) {
    const select = document.getElementById('related-role-select');
    select.innerHTML = '<option value="">Add related role...</option>';

    careerData.roles.forEach(career => {
        if (career.name !== currentCareerName) {
            const option = document.createElement('option');
            option.value = career.name;
            option.textContent = career.name;
            select.appendChild(option);
        }
    });
}

// Level Functions
function populateLevels(levels) {
    const container = document.getElementById('levels-container');
    container.innerHTML = '';

    if (levels.length === 0) {
        addLevel();
        addLevel();
    } else {
        levels.forEach(level => {
            addLevelWithData(level);
        });
    }
}

function addLevel() {
    addLevelWithData({
        title: '',
        summary: '',
        typical_experience: '',
        progresses_to: [],
        related_roles: []
    });
}

function addLevelWithData(levelData) {
    const container = document.getElementById('levels-container');
    const levelIndex = container.children.length;

    const levelDiv = document.createElement('div');
    levelDiv.className = 'level-item';
    levelDiv.dataset.index = levelIndex;

    levelDiv.innerHTML = `
        <div class="level-header">
            <h4>Level ${levelIndex + 1}</h4>
            <div class="level-actions">
                <button type="button" class="btn btn-danger btn-sm" onclick="removeLevel(this)">Remove</button>
            </div>
        </div>
        <div class="level-content">
            <div class="form-group">
                <label>Title *</label>
                <input type="text" class="level-title" value="${levelData.title || ''}" required />
            </div>
            <div class="form-group">
                <label>Summary *</label>
                <textarea class="level-summary" rows="3" required>${levelData.summary || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Typical Experience</label>
                <input type="text" class="level-experience" value="${levelData.typical_experience || ''}" />
            </div>
            <div class="form-group">
                <label>Progresses To (level titles, comma-separated)</label>
                <input type="text" class="level-progresses" value="${(levelData.progresses_to || []).join(', ')}" />
            </div>
            <div class="form-group">
                <label>Related Roles (comma-separated)</label>
                <input type="text" class="level-related" value="${(levelData.related_roles || []).join(', ')}" />
            </div>
        </div>
    `;

    container.appendChild(levelDiv);
}

window.removeLevel = function(button) {
    const levelItem = button.closest('.level-item');
    levelItem.remove();

    // Renumber remaining levels
    const container = document.getElementById('levels-container');
    Array.from(container.children).forEach((level, index) => {
        level.dataset.index = index;
        level.querySelector('.level-header h4').textContent = `Level ${index + 1}`;
    });
};

function getLevels() {
    const container = document.getElementById('levels-container');
    const levelItems = Array.from(container.querySelectorAll('.level-item'));

    return levelItems.map(item => {
        const title = item.querySelector('.level-title').value.trim();
        const summary = item.querySelector('.level-summary').value.trim();
        const experience = item.querySelector('.level-experience').value.trim();
        const progressesTo = item.querySelector('.level-progresses').value
            .split(',')
            .map(s => s.trim())
            .filter(s => s);
        const relatedRoles = item.querySelector('.level-related').value
            .split(',')
            .map(s => s.trim())
            .filter(s => s);

        return {
            title,
            summary,
            typical_experience: experience,
            progresses_to: progressesTo,
            related_roles: relatedRoles
        };
    });
}

// Validation
function validateCareer(career) {
    const errors = [];

    // Required fields
    if (!career.name) errors.push('Career name is required');
    if (!career.salary_range) errors.push('Salary range is required');
    if (!career.overview) errors.push('Overview is required');
    if (!career.work_style) errors.push('Work style is required');

    // Salary format validation
    if (career.salary_range && !isValidSalaryFormat(career.salary_range)) {
        errors.push('Salary must be in format: $XX,XXX - $XX,XXX');
    }

    // Video URL format validation (optional field)
    if (career.video_url && !isValidYouTubeURL(career.video_url)) {
        errors.push('Video URL must be a valid YouTube link (e.g., https://www.youtube.com/watch?v=...)');
    }

    // Array minimums
    if (career.core_skills.length === 0) {
        errors.push('At least one core skill is required');
    }
    if (career.core_education.length === 0) {
        errors.push('At least one education requirement is required');
    }
    if (career.levels.length < 2) {
        errors.push('At least 2 career levels are required');
    }

    // Level validation
    career.levels.forEach((level, i) => {
        if (!level.title) errors.push(`Level ${i + 1}: title is required`);
        if (!level.summary) errors.push(`Level ${i + 1}: summary is required`);
    });

    // Duplicate name check
    const duplicate = careerData.roles.find((c, i) =>
        c.name === career.name && i !== currentEditIndex
    );
    if (duplicate) {
        errors.push(`Career name "${career.name}" already exists`);
    }

    return errors;
}

function isValidSalaryFormat(salary) {
    return /^\$[\d,]+ - \$[\d,]+$/.test(salary);
}

function isValidYouTubeURL(url) {
    // Match YouTube URLs in various formats:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
}

function showValidationErrors(errors) {
    const errorDiv = document.getElementById('validation-errors');
    errorDiv.innerHTML = `
        <h4>Please fix the following errors:</h4>
        <ul>
            ${errors.map(error => `<li>${error}</li>`).join('')}
        </ul>
    `;
    errorDiv.style.display = 'block';
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideValidationErrors() {
    document.getElementById('validation-errors').style.display = 'none';
}

// UI Functions
function openEditPanel() {
    editPanel.classList.add('open');
}

function closeEditPanel() {
    editPanel.classList.remove('open');
    setTimeout(() => {
        clearForm();
    }, 300);
}

function showLoading(message) {
    loadingMessage.textContent = message;
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function showError(message, element) {
    element.textContent = message;
    element.style.display = 'block';

    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

console.log('✅ Admin dashboard initialized');
