const API_BASE_URL = 'http://localhost:5000/api';

function getAuthToken() {
    // Check if this is the line causing issues
    const token = localStorage.getItem('authToken'); 
    return token || 'DUMMY_TOKEN_FOR_TESTING'; // <-- The backend probably rejects this DUMMY_TOKEN
}


function getCurrentBulletPointText() {
    // --- IMPORTANT: Update this line to get the text of the item you want to analyze ---
    // For example, if you have a currently active job experience input field:
    // return document.querySelector('.active-job-bullet-point-input')?.value || '';
    
    // For now, returning a placeholder or checking a simple field
    return document.getElementById('experience-bullet-point-input-id')?.value || 'Managed a team of 5 people and handled all client communications.';
}

function checkAuth() {
    // Placeholder function: check if user is logged in
    const token = getAuthToken();
    if (!token || token === 'DUMMY_TOKEN_FOR_TESTING') {
        console.warn('User not authenticated. Using dummy token.');
        // Optional: Redirect to login or stop execution
        // window.location.href = 'login.html';
        // return null;
    }
    return { id: 1, name: 'Test User' }; // Dummy user object
}



// Resume Builder functionality
let resumeData = {
    id: null,
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    summary: '',
    experience: [],
    education: [],
    skills: []
};

let experienceCounter = 0;
let educationCounter = 0;

// Initialize resume builder
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const user = checkAuth();
    if (!user) return;
    
    // Check if editing existing resume
    const urlParams = new URLSearchParams(window.location.search);
    const resumeId = urlParams.get('id');
    
    if (resumeId) {
        loadResume(resumeId);
    } else {
        // Add initial experience and education
        addExperience();
        addEducation();
    }
    
    // Setup auto-save (debounced)
    setupAutoSave();
    
    // Setup event listeners for live preview
    setupLivePreview();
});

// Load existing resume
async function loadResume(resumeId) {
    try {
        const token = getAuthToken();
        
        const response = await fetch(`${API_BASE_URL}/resume/${resumeId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load resume');
        }
        
        const data = await response.json();
        resumeData = data.resume;
        
        // Populate form fields
        populateForm();
        updatePreview();
        
        Utils.showAlert('Resume loaded successfully', 'success');
        
    } catch (error) {
        console.error('Error loading resume:', error);
        Utils.showAlert('Failed to load resume', 'error');
    }
}

// Populate form with resume data
function populateForm() {
    document.getElementById('full-name').value = resumeData.name || '';
    document.getElementById('job-title').value = resumeData.title || '';
    document.getElementById('email').value = resumeData.email || '';
    document.getElementById('phone').value = resumeData.phone || '';
    document.getElementById('location').value = resumeData.location || '';
    document.getElementById('linkedin').value = resumeData.linkedin || '';
    document.getElementById('summary').value = resumeData.summary || '';
    
    // Populate experience
    if (resumeData.experience && resumeData.experience.length > 0) {
        resumeData.experience.forEach(exp => {
            addExperience(exp);
        });
    } else {
        addExperience();
    }
    
    // Populate education
    if (resumeData.education && resumeData.education.length > 0) {
        resumeData.education.forEach(edu => {
            addEducation(edu);
        });
    } else {
        addEducation();
    }
    
    // Populate skills
    if (resumeData.skills && resumeData.skills.length > 0) {
        resumeData.skills.forEach(skill => {
            addSkillToList(skill);
        });
    }
}

// Add experience entry
function addExperience(data = null) {
    const id = experienceCounter++;
    const experienceList = document.getElementById('experience-list');
    
    const experienceItem = document.createElement('div');
    experienceItem.className = 'border-2 border-gray-200 rounded-lg p-4 animate-scale-in';
    experienceItem.id = `experience-${id}`;
    
    experienceItem.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <h4 class="font-semibold text-gray-900">Experience #${id + 1}</h4>
            <button onclick="removeExperience(${id})" class="text-red-600 hover:text-red-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
        <div class="space-y-3">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input type="text" data-field="experience-${id}-title" class="input-field" placeholder="Software Engineer" value="${data?.title || ''}">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input type="text" data-field="experience-${id}-company" class="input-field" placeholder="Company Name" value="${data?.company || ''}">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="text" data-field="experience-${id}-start" class="input-field" placeholder="Jan 2020" value="${data?.startDate || ''}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="text" data-field="experience-${id}-end" class="input-field" placeholder="Present" value="${data?.endDate || 'Present'}">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea data-field="experience-${id}-description" rows="3" class="input-field resize-none" placeholder="Describe your responsibilities and achievements...">${data?.description || ''}</textarea>
            </div>
        </div>
    `;
    
    experienceList.appendChild(experienceItem);
    
    // Add event listeners for live preview
    experienceItem.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', Utils.debounce(updatePreview, 300));
    });
}

// Remove experience entry
function removeExperience(id) {
    const element = document.getElementById(`experience-${id}`);
    if (element) {
        element.remove();
        updatePreview();
    }
}

// Add education entry
function addEducation(data = null) {
    const id = educationCounter++;
    const educationList = document.getElementById('education-list');
    
    const educationItem = document.createElement('div');
    educationItem.className = 'border-2 border-gray-200 rounded-lg p-4 animate-scale-in';
    educationItem.id = `education-${id}`;
    
    educationItem.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <h4 class="font-semibold text-gray-900">Education #${id + 1}</h4>
            <button onclick="removeEducation(${id})" class="text-red-600 hover:text-red-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
        <div class="space-y-3">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                <input type="text" data-field="education-${id}-degree" class="input-field" placeholder="Bachelor of Science" value="${data?.degree || ''}">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <input type="text" data-field="education-${id}-institution" class="input-field" placeholder="University Name" value="${data?.institution || ''}">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
                    <input type="text" data-field="education-${id}-start" class="input-field" placeholder="2016" value="${data?.startYear || ''}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">End Year</label>
                    <input type="text" data-field="education-${id}-end" class="input-field" placeholder="2020" value="${data?.endYear || ''}">
                </div>
            </div>
        </div>
    `;
    
    educationList.appendChild(educationItem);
    
    // Add event listeners for live preview
    educationItem.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', Utils.debounce(updatePreview, 300));
    });
}

// Remove education entry
function removeEducation(id) {
    const element = document.getElementById(`education-${id}`);
    if (element) {
        element.remove();
        updatePreview();
    }
}

// Add skill
function addSkill() {
    const skillInput = document.getElementById('skill-input');
    const skill = skillInput.value.trim();
    
    if (skill) {
        addSkillToList(skill);
        skillInput.value = '';
        updatePreview();
    }
}

// Add skill to list
function addSkillToList(skill) {
    const skillsList = document.getElementById('skills-list');
    
    const skillBadge = document.createElement('div');
    skillBadge.className = 'badge badge-primary flex items-center gap-2 animate-scale-in';
    skillBadge.innerHTML = `
        <span>${skill}</span>
        <button onclick="removeSkill(this)" class="hover:text-primary-900">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
        </button>
    `;
    
    skillsList.appendChild(skillBadge);
}

// Remove skill
function removeSkill(button) {
    button.parentElement.remove();
    updatePreview();
}

// Allow Enter key to add skill
document.getElementById('skill-input')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addSkill();
    }
});

// Collect resume data from form
function collectResumeData() {
    const data = {
        id: resumeData.id,
        name: document.getElementById('full-name').value.trim(),
        title: document.getElementById('job-title').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        location: document.getElementById('location').value.trim(),
        linkedin: document.getElementById('linkedin').value.trim(),
        summary: document.getElementById('summary').value.trim(),
        experience: [],
        education: [],
        skills: []
    };
    
    // Collect experience
    document.querySelectorAll('[id^="experience-"]').forEach(expElement => {
        const id = expElement.id.split('-')[1];
        const exp = {
            title: document.querySelector(`[data-field="experience-${id}-title"]`)?.value.trim() || '',
            company: document.querySelector(`[data-field="experience-${id}-company"]`)?.value.trim() || '',
            startDate: document.querySelector(`[data-field="experience-${id}-start"]`)?.value.trim() || '',
            endDate: document.querySelector(`[data-field="experience-${id}-end"]`)?.value.trim() || '',
            description: document.querySelector(`[data-field="experience-${id}-description"]`)?.value.trim() || ''
        };
        if (exp.title || exp.company) {
            data.experience.push(exp);
        }
    });
    
    // Collect education
    document.querySelectorAll('[id^="education-"]').forEach(eduElement => {
        const id = eduElement.id.split('-')[1];
        const edu = {
            degree: document.querySelector(`[data-field="education-${id}-degree"]`)?.value.trim() || '',
            institution: document.querySelector(`[data-field="education-${id}-institution"]`)?.value.trim() || '',
            startYear: document.querySelector(`[data-field="education-${id}-start"]`)?.value.trim() || '',
            endYear: document.querySelector(`[data-field="education-${id}-end"]`)?.value.trim() || ''
        };
        if (edu.degree || edu.institution) {
            data.education.push(edu);
        }
    });
    
    // Collect skills
    document.querySelectorAll('#skills-list .badge').forEach(badge => {
        const skill = badge.querySelector('span').textContent.trim();
        if (skill) {
            data.skills.push(skill);
        }
    });
    
    return data;
}

// Update preview
function updatePreview() {
    const data = collectResumeData();
    const previewEl = document.getElementById('resume-preview');
    
    previewEl.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="text-center border-b-2 border-primary-600 pb-4">
                <h1 class="text-3xl font-bold text-gray-900 mb-1">${data.name || 'Your Name'}</h1>
                <p class="text-lg text-primary-600 font-medium mb-2">${data.title || 'Your Job Title'}</p>
                <div class="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                    ${data.email ? `<span class="flex items-center"><svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>${data.email}</span>` : ''}
                    ${data.phone ? `<span class="flex items-center"><svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>${data.phone}</span>` : ''}
                    ${data.location ? `<span class="flex items-center"><svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>${data.location}</span>` : ''}
                    ${data.linkedin ? `<span class="flex items-center"><svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 0C4.477 0 0 4.477 0 10c0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zm-1.937 15.418H5.687V8.312h2.376v7.106zM6.875 7.312c-.76 0-1.375-.616-1.375-1.375S6.115 4.562 6.875 4.562c.76 0 1.375.616 1.375 1.375s-.615 1.375-1.375 1.375zm8.523 8.106h-2.375v-3.452c0-.885-.016-2.024-1.234-2.024-1.236 0-1.425.965-1.425 1.961v3.515H7.988V8.312h2.277v.969h.032c.317-.6 1.092-1.234 2.246-1.234 2.402 0 2.845 1.582 2.845 3.638v3.733z"></path></svg>${data.linkedin}</span>` : ''}
                </div>
            </div>
            
            <!-- Summary -->
            ${data.summary ? `
            <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">PROFESSIONAL SUMMARY</h2>
                <p class="text-gray-700 leading-relaxed">${data.summary}</p>
            </div>
            ` : ''}
            
            <!-- Experience -->
            ${data.experience.length > 0 ? `
            <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">WORK EXPERIENCE</h2>
                <div class="space-y-4">
                    ${data.experience.map(exp => `
                        <div>
                            <div class="flex justify-between items-start mb-1">
                                <h3 class="font-bold text-gray-900">${exp.title}</h3>
                                <span class="text-sm text-gray-600">${exp.startDate} - ${exp.endDate}</span>
                            </div>
                            <p class="text-primary-600 font-medium mb-2">${exp.company}</p>
                            <p class="text-gray-700 text-sm leading-relaxed">${exp.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- Education -->
            ${data.education.length > 0 ? `
            <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">EDUCATION</h2>
                <div class="space-y-3">
                    ${data.education.map(edu => `
                        <div>
                            <div class="flex justify-between items-start">
                                <div>
                                    <h3 class="font-bold text-gray-900">${edu.degree}</h3>
                                    <p class="text-gray-700">${edu.institution}</p>
                                </div>
                                <span class="text-sm text-gray-600">${edu.startYear} - ${edu.endYear}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- Skills -->
            ${data.skills.length > 0 ? `
            <div>
                <h2 class="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">SKILLS</h2>
                <div class="flex flex-wrap gap-2">
                    ${data.skills.map(skill => `
                        <span class="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">${skill}</span>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// Setup live preview
function setupLivePreview() {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', Utils.debounce(updatePreview, 300));
    });
}

// Setup auto-save
function setupAutoSave() {
    setInterval(() => {
        if (resumeData.id) {
            saveResume(true); // Silent save
        }
    }, 60000); // Auto-save every minute
}

// Save resume
async function saveResume(silent = false) {
    const data = collectResumeData();
    const saveBtn = document.getElementById('save-btn');
    const originalText = saveBtn.innerHTML;
    
    try {
        if (!silent) {
            saveBtn.innerHTML = '<div class="spinner"></div>';
            saveBtn.disabled = true;
        }
        
        const token = getAuthToken();
        
        const response = await fetch(`${API_BASE_URL}/resume/save`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save resume');
        }
        
        const result = await response.json();
        resumeData.id = result.resumeId;
        
        if (!silent) {
            Utils.showAlert('Resume saved successfully!', 'success');
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Error saving resume:', error);
        if (!silent) {
            Utils.showAlert('Failed to save resume', 'error');
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }
}

// ===============================================
// UPDATED FUNCTION: getAISuggestions
// ===============================================
async function getAISuggestions() {
    const textToSuggestOn = getCurrentBulletPointText(); // Get the relevant text
    const btnId = 'ai-suggest-btn';
    const btn = document.getElementById(btnId);
    const suggestionsEl = document.getElementById('ai-suggestions');
    const originalText = btn.textContent;

    if (!textToSuggestOn.trim() || textToSuggestOn.length < 5) {
        Utils.showAlert('Please enter a longer bullet point (at least 5 characters) to get suggestions.', 'warning');
        return;
    }
    
    try {
        Utils.showLoading(btnId, 'Generating AI suggestions...'); 
        suggestionsEl.innerHTML = '<p class="text-sm text-gray-600">Generating AI suggestions...</p>';
        
        const token = getAuthToken();
        
        const response = await fetch(`${API_BASE_URL}/ai/suggestions`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            // --- FIX HERE: Sending 'text' key to match Flask ---
            body: JSON.stringify({ text: textToSuggestOn }) 
        });
        
        if (!response.ok) {
            throw new Error('Failed to get suggestions');
        }
        
        const result = await response.json();
        console.log("AI Suggestions Response Result:", result); 
        
        if (result.success && Array.isArray(result.suggestions) && result.suggestions.length > 0) {
            suggestionsEl.innerHTML = result.suggestions.map((suggestion, index) => `
                <div class="ai-suggestion space-y-2">
                    <div class="flex items-start gap-2">
                        <div class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span class="text-xs font-bold text-primary-600">${index + 1}</span>
                        </div>
                        <p class="text-sm text-gray-700">${suggestion}</p>
                    </div>
                </div>
            `).join('');
            
            // Optionally display the tip if available
            if (result.tip) {
                 suggestionsEl.insertAdjacentHTML('beforeend', `<p class="mt-4 text-xs italic text-gray-500 border-t pt-2">Tip: ${result.tip}</p>`);
            }
        } else {
            suggestionsEl.innerHTML = '<p class="text-sm text-green-600">No suggestions were generated by the AI for your current content.</p>';
        }
        
    } catch (error) {
        console.error('Error getting AI suggestions:', error);
        Utils.showAlert('Failed to generate suggestions.', 'error');
        suggestionsEl.innerHTML = '<p class="text-sm text-red-600">Failed to generate suggestions. Please try again.</p>';
    } finally {
        Utils.hideLoading(btnId, originalText); 
    }
}
// ===============================================

// Check Grammar
async function checkGrammar(fieldId) {
    const text = document.getElementById(fieldId).value;
    const feedbackEl = document.getElementById(`grammar-feedback-${fieldId}`);
    
    // --- Configuration: Set a threshold for a "good" score
    const PASS_SCORE_THRESHOLD = 95; // Any score < 95 will trigger a warning/suggestion panel

    if (!text.trim()) {
        Utils.showAlert('Please enter some text first', 'warning');
        return;
    }

    try {
        // 1. Show Loading State
        feedbackEl.classList.remove('hidden');
        feedbackEl.innerHTML = '<div class="flex items-center"><div class="spinner mr-2"></div><span class="text-sm">Checking grammar...</span></div>';
        
        const token = getAuthToken();
        
        // 2. API Call to /ai/grammar-check
        const response = await fetch(`${API_BASE_URL}/ai/grammar-check`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) {
            throw new Error(`API failed with status: ${response.status}`);
        }
        
        // 3. Process Result
        const result = await response.json();
        const score = result.score || 0; 
        
        if (result.success) {
            
            // FIX: Check for explicit API errors OR a score below the quality threshold
            if ((result.has_errors && result.corrections && result.corrections.length > 0) || score < PASS_SCORE_THRESHOLD) {
                
                // Determine severity and colors for visual feedback
                const isMinorIssue = score >= 90 && score < PASS_SCORE_THRESHOLD;
                const correctionTitle = isMinorIssue ? 'Quality Check: Suggestions' : 'Grammar Issues Found';
                const textColor = isMinorIssue ? 'text-orange-900' : 'text-blue-900';
                const iconColor = isMinorIssue ? 'text-orange-600' : 'text-blue-600';
                const borderColor = isMinorIssue ? 'border-orange-300' : 'border-blue-300';
                
                // Fallback suggestion: If score is low (e.g., 90) but API sent no corrections, show a general tip
                const correctionsList = result.corrections && result.corrections.length > 0 
                    ? result.corrections 
                    : [`Your quality score is ${score}/100. Review carefully for clarity, conciseness, and any potential missed errors (like capitalization or singular/plural misuse).`];

                feedbackEl.innerHTML = `
                    <div class="space-y-2 p-2 rounded-lg bg-white border ${borderColor}">
                        <div class="flex items-center justify-between">
                            <span class="font-bold ${textColor}">${correctionTitle}</span>
                            <span class="text-sm ${iconColor}">Score: ${score}/100</span>
                        </div>
                        <ul class="space-y-1 text-sm">
                            ${correctionsList.map(correction => `
                                <li class="flex items-start">
                                    <svg class="w-4 h-4 ${iconColor} mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                                    </svg>
                                    <span>${correction}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            } else {
                // Perfect or near-perfect score (>= 95), display success
                feedbackEl.innerHTML = `
                    <div class="flex items-center text-green-700 p-2 rounded-lg bg-white border border-green-300">
                        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="font-semibold">Great! No major issues found. Score: ${score}/100</span>
                    </div>
                `;
            }
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                feedbackEl.classList.add('hidden');
            }, 10000);
        } else {
             // Handle case where result.success is false
             feedbackEl.innerHTML = `<p class="text-sm text-red-600">Grammar check failed: ${result.message || 'API error.'}</p>`;
        }
        
    } catch (error) {
        console.error('Error checking grammar:', error);
        feedbackEl.innerHTML = '<p class="text-sm text-red-600">Failed to check grammar. Please check your network connection and API endpoint.</p>';
    }
}

// ===============================================
// UPDATED FUNCTION: optimizeForRole
// ===============================================
async function optimizeForRole() {
    const btnId = 'optimize-btn';
    const btn = document.getElementById(btnId);
    const optimizationEl = document.getElementById('role-optimization');
    const originalText = btn?.textContent || 'Optimize Resume';

    // --- CRITICAL FIX: The Resume Summary input element ID is 'summary' from the HTML ---
    const targetRoleInput = document.getElementById('target-role');
    
    // !!! FIX APPLIED HERE !!!: Replaced placeholder with the actual HTML ID.
    const RESUME_SUMMARY_ID = 'summary'; 
    const resumeSummaryInput = document.getElementById(RESUME_SUMMARY_ID); 
    
    // If any of these console errors show up, that is the root of the problem.
    if (!btn) { console.error(`Element with ID ${btnId} (Optimize Button) not found!`); return; }
    if (!optimizationEl) { console.error(`Element with ID role-optimization not found!`); return; }
    if (!targetRoleInput) { console.error(`Element with ID target-role (Role Input) not found!`); return; }
    if (!resumeSummaryInput) { 
        // This error should now never fire if the HTML element 'summary' exists.
        console.error(`Element with ID ${RESUME_SUMMARY_ID} (Summary Input) not found!`); 
        Utils.showAlert(`Configuration Error: Summary Input field missing. Please set the correct ID in resume-builder.js (Currently set to: ${RESUME_SUMMARY_ID}).`, 'error');
        return; 
    }
    // ---------------------------------------------------

    const targetRole = targetRoleInput.value.trim();
    const resumeSummary = resumeSummaryInput.value.trim(); 
    
    if (!targetRole) {
        Utils.showAlert('Please enter a target role', 'warning');
        return;
    }
    
    // This check now works correctly, ensuring the summary is filled before API call.
    if (!resumeSummary) {
        Utils.showAlert('Please ensure your resume summary is filled out.', 'warning');
        return;
    }
    
    try {
        Utils.showLoading(btnId, 'Optimizing for Role...');
        optimizationEl.innerHTML = '<p class="text-sm text-gray-600">Optimizing for role...</p>';
        
        const token = getAuthToken();
        
        const response = await fetch(`${API_BASE_URL}/ai/optimize`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                resumeSummary: resumeSummary,
                targetRole: targetRole
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to optimize resume');
        }
        
        const result = await response.json();
        console.log("Role Optimization Response Result:", result); 
        
        if (result.success && (result.optimized_summary || (result.target_keywords && result.target_keywords.length > 0))) {
            optimizationEl.innerHTML = `
                <div class="space-y-4">
                    ${result.optimized_summary ? `
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-2 flex items-center">
                            <svg class="w-4 h-4 mr-1 text-primary-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM6.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm5 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clip-rule="evenodd" fill-rule="evenodd"></path></svg>
                            Optimized Summary
                        </h4>
                        <p class="text-sm text-gray-700 p-3 bg-blue-50 rounded">${result.optimized_summary}</p>
                    </div>
                    ` : ''}

                    ${result.target_keywords && result.target_keywords.length > 0 ? `
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-2 flex items-center">
                            <svg class="w-4 h-4 mr-1 text-primary-600" fill="currentColor" viewBox="0 0 20 20"><path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" fill-rule="evenodd"></path></svg>
                            Target Keywords to Include
                        </h4>
                        <div class="flex flex-wrap gap-2">
                            ${result.target_keywords.map(keyword => `
                                <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">${keyword}</span>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        } else {
            optimizationEl.innerHTML = '<p class="text-sm text-green-600">Optimization complete! The AI generated minimal changes.</p>';
        }

    } catch (error) {
        console.error('Error optimizing resume:', error);
        Utils.showAlert('Failed to optimize resume.', 'error');
        optimizationEl.innerHTML = '<p class="text-sm text-red-600">Failed to optimize resume. Please try again.</p>';
    } finally {
        // This will now restore the button's appearance (make it blue) and re-enable it.
        Utils.hideLoading(btnId, originalText);
    }
}

// ===============================================

// ===============================================
// EVENT LISTENERS (Verify these are present)
// ===============================================

// Listener for AI Suggestions Button
document.getElementById('ai-suggest-btn')?.addEventListener('click', getAISuggestions);

// Listener for Role Optimization Button
document.getElementById('optimize-btn')?.addEventListener('click', optimizeForRole);

// Listener for Grammar Check Button (New/Verification)
document.getElementById('grammar-check-btn')?.addEventListener('click', checkGrammar);
// Save button handler
document.getElementById('save-btn')?.addEventListener('click', function() {
    saveResume(false);
});

// Example code
async function checkConnection() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    const data = await res.json();
    console.log('✅', data.message);
  } catch (err) {
    console.error('❌ Error connecting to backend:', err);
  }
}

checkConnection();


// Initial preview
updatePreview();

// Export functions
window.addExperience = addExperience;
window.removeExperience = removeExperience;
window.addEducation = addEducation;
window.removeEducation = removeEducation;
window.addSkill = addSkill;
window.removeSkill = removeSkill;
window.getAISuggestions = getAISuggestions;
window.checkGrammar = checkGrammar;
window.optimizeForRole = optimizeForRole;