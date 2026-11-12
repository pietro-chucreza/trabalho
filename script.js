const STORAGE_KEYS = {
    theme: 'power-theme',
    account: 'power-demo-account',
    session: 'power-demo-session',
    contacts: 'power-demo-contacts',
    feedback: 'power-demo-feedback'
};

const toast = document.querySelector('#toast');
let toastTimeout;

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove('show'), 3200);
}

function readStorage(key, fallback) {
    const savedValue = localStorage.getItem(key);
    if (savedValue === null) return fallback;

    try {
        return JSON.parse(savedValue);
    } catch (error) {
        console.error(`Não foi possível ler os dados locais de ${key}.`, error);
        localStorage.removeItem(key);
        showToast('Um dado de demonstração estava inválido e foi removido.');
        return fallback;
    }
}

function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Menu para telas menores.
const menuToggle = document.querySelector('#menuToggle');
const mainNav = document.querySelector('#mainNav');
menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
});
mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
    });
});

// Tema claro ou escuro, salvo neste navegador.
const themeToggle = document.querySelector('#themeToggle');
function setTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    themeToggle.innerHTML = isDark ? '☀ <span>Modo claro</span>' : '☾ <span>Modo escuro</span>';
    themeToggle.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');
    localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light');
}
setTheme(localStorage.getItem(STORAGE_KEYS.theme) === 'dark');
themeToggle.addEventListener('click', () => setTheme(!document.body.classList.contains('dark-mode')));

// Voltar ao topo.
const backToTop = document.querySelector('#backToTop');
window.addEventListener('scroll', () => backToTop.classList.toggle('visible', window.scrollY > 420));
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Controles fictícios da demonstração do aplicativo.
const sosButton = document.querySelector('#sosButton');
const cancelSos = document.querySelector('#cancelSos');
const countdown = document.querySelector('#countdown');
const statusPill = document.querySelector('#statusPill');
const statusText = document.querySelector('#statusText');
const protectionStatus = document.querySelector('#protectionStatus');
const locationStatus = document.querySelector('#locationStatus');
let sosTimer = null;
let secondsLeft = 5;
let protectionActive = false;
let locationShared = false;

function setDemoStatus(label, message, isActive) {
    statusPill.textContent = label;
    statusPill.classList.toggle('active', isActive);
    statusText.textContent = message;
}

function cancelCountdown(showMessage) {
    if (sosTimer !== null) {
        window.clearInterval(sosTimer);
        sosTimer = null;
    }
    sosButton.disabled = false;
    cancelSos.classList.add('hidden');
    countdown.textContent = '';
    if (showMessage) {
        setDemoStatus('Tudo tranquilo', 'Contagem cancelada. Nenhum alerta foi enviado.', false);
        showToast('Demonstração do SOS cancelada.');
    }
}

sosButton.addEventListener('click', () => {
    if (sosTimer !== null) return;
    secondsLeft = 5;
    sosButton.disabled = true;
    cancelSos.classList.remove('hidden');
    countdown.textContent = `Demonstração em ${secondsLeft} segundos...`;
    setDemoStatus('Contagem em andamento', 'Você pode cancelar a demonstração a qualquer momento.', true);
    sosTimer = window.setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft > 0) {
            countdown.textContent = `Demonstração em ${secondsLeft} segundos...`;
            return;
        }
        cancelCountdown(false);
        countdown.textContent = 'Demonstração concluída! Nenhum pedido real foi enviado.';
        setDemoStatus('Demonstração concluída', 'O pedido de ajuda foi apenas simulado nesta página.', false);
        showToast('Demonstração concluída. Nenhum alerta foi enviado.');
    }, 1000);
});
cancelSos.addEventListener('click', () => cancelCountdown(true));

document.querySelector('#locationButton').addEventListener('click', (event) => {
    locationShared = !locationShared;
    locationStatus.textContent = locationShared ? 'Simulação ativa' : 'Não compartilhada';
    event.currentTarget.textContent = locationShared ? 'Desativar simulação' : 'Simular localização';
    setDemoStatus(locationShared ? 'Localização simulada' : 'Tudo tranquilo',
        locationShared ? 'Nenhuma localização foi acessada ou compartilhada.' : 'Simulação de localização desativada.', locationShared);
    showToast(locationShared
        ? 'Localização compartilhada apenas como simulação.'
        : 'Simulação de localização desativada.');
});

document.querySelector('#protectionButton').addEventListener('click', (event) => {
    protectionActive = !protectionActive;
    protectionStatus.textContent = protectionActive ? 'Ativada (simulação)' : 'Desativada';
    event.currentTarget.textContent = protectionActive ? 'Desativar proteção' : 'Ativar proteção';
    event.currentTarget.setAttribute('aria-pressed', String(protectionActive));
    setDemoStatus(protectionActive ? 'Proteção simulada' : 'Tudo tranquilo',
        protectionActive ? 'Modo de proteção ativo somente nesta demonstração.' : 'Modo de proteção desativado.', protectionActive);
    showToast(protectionActive ? 'Modo de proteção simulado ativado.' : 'Modo de proteção simulado desativado.');
});

// Conta demonstrativa. A senha fica representada por um hash local, nunca em texto aberto.
function bytesToHex(bytes) {
    return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error('A proteção de senha não está disponível. Abra o projeto em um navegador atualizado.');
    }
    const encodedPassword = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await window.crypto.subtle.digest('SHA-256', encodedPassword);
    return bytesToHex(digest);
}

function showAccountMessage(message, type) {
    const messageElement = document.querySelector('#accountMessage');
    messageElement.textContent = message;
    messageElement.className = `form-message ${type}`;
}

function updateAccountView() {
    const account = readStorage(STORAGE_KEYS.account, null);
    const session = readStorage(STORAGE_KEYS.session, null);
    const isLoggedIn = Boolean(account && session && session.email === account.email);
    document.querySelector('.tab-row').classList.toggle('hidden', isLoggedIn);
    document.querySelectorAll('.account-form').forEach((form) => form.classList.toggle('hidden', isLoggedIn || !form.classList.contains('active-form')));
    document.querySelector('#loggedIn').classList.toggle('hidden', !isLoggedIn);
    if (isLoggedIn) {
        document.querySelector('#welcomeUser').textContent = `Você entrou como ${session.name}.`;
    }
}

document.querySelectorAll('.account-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.account-tab').forEach((item) => item.classList.toggle('active', item === tab));
        document.querySelectorAll('.account-form').forEach((form) => {
            const isActive = form.id === tab.dataset.tab;
            form.classList.toggle('active-form', isActive);
            form.classList.toggle('hidden', !isActive);
        });
        showAccountMessage('', '');
    });
});

document.querySelector('#registerPanel').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim().toLowerCase();
    const password = form.elements.password.value;
    const confirmation = form.elements.confirmPassword.value;
    if (password !== confirmation) {
        showAccountMessage('As senhas não são iguais.', 'error');
        return;
    }
    if (readStorage(STORAGE_KEYS.account, null)) {
        showAccountMessage('Já existe uma conta neste navegador. Entre ou limpe os dados da demonstração.', 'error');
        return;
    }

    try {
        const salt = bytesToHex(window.crypto.getRandomValues(new Uint8Array(16)));
        const passwordHash = await hashPassword(password, salt);
        const account = { name, email, salt, passwordHash };
        writeStorage(STORAGE_KEYS.account, account);
        writeStorage(STORAGE_KEYS.session, { name, email });
        form.reset();
        showAccountMessage('Conta de demonstração criada com sucesso!', 'success');
        updateAccountView();
    } catch (error) {
        console.error('Não foi possível criar a conta demonstrativa.', error);
        showAccountMessage(error.message || 'Não foi possível salvar a conta neste navegador.', 'error');
    }
});

document.querySelector('#loginPanel').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.elements.email.value.trim().toLowerCase();
    const password = form.elements.password.value;
    const account = readStorage(STORAGE_KEYS.account, null);
    if (!account || account.email !== email) {
        showAccountMessage('Não encontramos uma conta com esse e-mail neste navegador.', 'error');
        return;
    }

    try {
        const passwordHash = await hashPassword(password, account.salt);
        if (passwordHash !== account.passwordHash) {
            showAccountMessage('A senha não confere. Tente novamente.', 'error');
            return;
        }
        writeStorage(STORAGE_KEYS.session, { name: account.name, email: account.email });
        form.reset();
        showAccountMessage('Acesso realizado com sucesso!', 'success');
        updateAccountView();
    } catch (error) {
        console.error('Não foi possível entrar na conta demonstrativa.', error);
        showAccountMessage(error.message || 'Não foi possível acessar a conta neste navegador.', 'error');
    }
});

document.querySelector('#logoutButton').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.session);
    document.querySelectorAll('.account-form').forEach((form) => form.classList.remove('active-form'));
    document.querySelector('#registerPanel').classList.add('active-form');
    document.querySelectorAll('.account-tab').forEach((tab, index) => tab.classList.toggle('active', index === 0));
    showAccountMessage('Você saiu da conta demonstrativa.', 'success');
    updateAccountView();
});
document.querySelector('#registerPanel').classList.add('active-form');
updateAccountView();

// Lista local de até cinco contatos.
const contactList = document.querySelector('#contactList');
const contactCount = document.querySelector('#contactCount');
const emptyContacts = document.querySelector('#emptyContacts');
const addContactButton = document.querySelector('#addContactButton');

function renderContacts() {
    const contacts = readStorage(STORAGE_KEYS.contacts, []);
    contactList.replaceChildren();
    contacts.forEach((contact, index) => {
        const item = document.createElement('li');
        item.className = 'contact-item';
        const detail = document.createElement('div');
        const name = document.createElement('span');
        name.className = 'contact-name';
        name.textContent = contact.name;
        const phone = document.createElement('span');
        phone.className = 'contact-phone';
        phone.textContent = contact.phone;
        detail.append(name, phone);
        const removeButton = document.createElement('button');
        removeButton.className = 'delete-contact';
        removeButton.type = 'button';
        removeButton.textContent = 'Excluir';
        removeButton.setAttribute('aria-label', `Excluir contato ${contact.name}`);
        removeButton.addEventListener('click', () => {
            const updatedContacts = readStorage(STORAGE_KEYS.contacts, []);
            updatedContacts.splice(index, 1);
            writeStorage(STORAGE_KEYS.contacts, updatedContacts);
            renderContacts();
            showToast('Contato removido da lista.');
        });
        item.append(detail, removeButton);
        contactList.append(item);
    });
    contactCount.textContent = `${contacts.length}/5`;
    emptyContacts.classList.toggle('hidden', contacts.length > 0);
    addContactButton.disabled = contacts.length >= 5;
    addContactButton.textContent = contacts.length >= 5 ? 'Limite de 5 contatos atingido' : 'Adicionar contato';
}

document.querySelector('#contactForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.contactName.value.trim();
    const phone = form.elements.contactPhone.value.trim();
    const digits = phone.replace(/\D/g, '');
    const contacts = readStorage(STORAGE_KEYS.contacts, []);
    const message = document.querySelector('#contactMessage');
    if (digits.length < 8 || digits.length > 15) {
        message.textContent = 'Digite um telefone válido, com 8 a 15 números.';
        message.className = 'form-message error';
        return;
    }
    if (contacts.length >= 5) {
        message.textContent = 'Você já atingiu o limite de cinco contatos.';
        message.className = 'form-message error';
        renderContacts();
        return;
    }
    contacts.push({ name, phone });
    writeStorage(STORAGE_KEYS.contacts, contacts);
    form.reset();
    message.textContent = 'Contato adicionado à lista deste navegador.';
    message.className = 'form-message success';
    renderContacts();
});
renderContacts();

// Números são exibidos na tela, mas nenhum botão inicia uma ligação.
document.querySelectorAll('.number-button').forEach((button) => {
    button.addEventListener('click', () => showToast(`${button.dataset.numberInfo}. Em uma emergência real, use o telefone para ligar.`));
});

// Sugestões salvas localmente para a demonstração.
const feedbackText = document.querySelector('#feedbackText');
const characterCount = document.querySelector('#characterCount');
const feedbackSaved = document.querySelector('#feedbackSaved');

function renderFeedback() {
    const suggestions = readStorage(STORAGE_KEYS.feedback, []);
    feedbackSaved.replaceChildren();
    if (suggestions.length === 0) return;
    const title = document.createElement('strong');
    title.textContent = 'Sugestões registradas neste navegador:';
    const list = document.createElement('ul');
    suggestions.slice(-3).forEach((suggestion) => {
        const item = document.createElement('li');
        item.textContent = suggestion;
        list.append(item);
    });
    feedbackSaved.append(title, list);
}

feedbackText.addEventListener('input', () => {
    characterCount.textContent = `${feedbackText.value.length}/500`;
});
document.querySelector('#feedbackForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const suggestion = feedbackText.value.trim();
    if (suggestion.length < 5) return;
    const suggestions = readStorage(STORAGE_KEYS.feedback, []);
    suggestions.push(suggestion);
    writeStorage(STORAGE_KEYS.feedback, suggestions.slice(-10));
    feedbackText.value = '';
    characterCount.textContent = '0/500';
    document.querySelector('#feedbackMessage').textContent = 'Obrigada pela sugestão! Ela foi salva neste navegador.';
    document.querySelector('#feedbackMessage').className = 'form-message success';
    renderFeedback();
    showToast('Sugestão registrada com sucesso.');
});
renderFeedback();

// Quiz rápido para revisar algumas orientações do projeto.
document.querySelector('#quizForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const answers = { q1: 'a', q2: 'b', q3: 'b' };
    const formData = new FormData(event.currentTarget);
    const score = Object.entries(answers).reduce((total, [question, answer]) => (
        total + (formData.get(question) === answer ? 1 : 0)
    ), 0);
    const message = score === 3 ? 'Muito bem! Você acertou tudo.' : 'Continue aprendendo: cada resposta ajuda a lembrar de formas de cuidado.';
    document.querySelector('#quizResult').textContent = `Sua pontuação: ${score} de 3. ${message}`;
});
