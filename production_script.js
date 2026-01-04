/**
 * PRODUCTION CLIENT SCRIPT
 * Copy this content into your 'script.js.html' file in Google Apps Script.
 * This connects to the real Sheet database.
 */

const lightIcons = { 1: "🕯️", 2: "🕯️", 3: "🌥️", 4: "✨", 5: "🌟" };

document.addEventListener('DOMContentLoaded', () => {
    refreshData();
    setupBeacon();
    // Poll every 30 seconds for updates
    setInterval(refreshData, 30000);
});

function refreshData() {
    // 1. Get Hope Count (Lantern)
    google.script.run
        .withSuccessHandler(updateHopeCount)
        .withFailureHandler(console.error)
        .getHopeCount();

    // 2. Get Wall Data (Whispers + Comments)
    google.script.run
        .withSuccessHandler(renderWall)
        .withFailureHandler(console.error)
        .getForumData();
}

function updateHopeCount(count) {
    const el = document.getElementById('hope-count');
    if (!el) return;

    // Animate if changed
    if (el.innerText != count) {
        el.innerText = count;
        el.style.textShadow = "0 0 20px #f59e0b";
        setTimeout(() => el.style.textShadow = "0 0 10px rgba(251, 191, 36, 0.5)", 500);
    }
}

function renderWall(whispers) {
    const grid = document.getElementById('bloom-grid');
    const template = document.getElementById('bloom-template');

    // Simple diffing: If count matches, maybe don't redraw... 
    // But for simplicity/robustness, we redraw. To improve UX, we could preserve open states.
    // For this hackathon scope: Redraw.
    grid.innerHTML = '';

    if (!whispers || whispers.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">The garden is quiet. Plant the first seed.</p>';
        return;
    }

    whispers.forEach(whisper => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.bloom-card');

        // Populate Whisper Data
        clone.querySelector('.bloom-icon').innerText = lightIcons[whisper.light] || "✨";
        clone.querySelector('.bloom-tag').innerText = whisper.tag;
        clone.querySelector('.content-text').innerText = `"${whisper.content}"`; // Note: API returns 'content'

        // Comments
        const comments = whisper.comments || [];
        const replyBtn = clone.querySelector('.view-replies-btn');
        const replyCountSpan = clone.querySelector('.reply-count');
        const threadDiv = clone.querySelector('.bloom-thread');
        const commentsDiv = clone.querySelector('.thread-comments');

        replyCountSpan.innerText = comments.length;

        // Render Existing Comments
        comments.forEach(c => {
            const comEl = document.createElement('div');
            comEl.className = 'comment-item';
            // Author might be a Date object ? No, string in DB. 
            // Time might be ISO string.
            const dateStr = c.time ? new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
            comEl.innerHTML = `<span class="comment-author">${c.author}</span> ${c.text} <span style="font-size:0.7em; opacity:0.5">${dateStr}</span>`;
            commentsDiv.appendChild(comEl);
        });

        // Toggle Thread
        replyBtn.addEventListener('click', () => {
            threadDiv.classList.toggle('hidden');
            replyBtn.innerText = threadDiv.classList.contains('hidden')
                ? `View Support (${comments.length})`
                : "Hide Support";
        });

        // Handle New Reply (Real Backend Call)
        const input = clone.querySelector('.reply-input');
        const sendBtn = clone.querySelector('.send-reply-btn');

        sendBtn.addEventListener('click', () => {
            if (!input.value) return;
            const text = input.value;

            // Disable UI while sending
            input.disabled = true;
            sendBtn.innerText = "...";

            google.script.run
                .withSuccessHandler((res) => {
                    // Success!
                    // Optimistic update or just refresh?
                    // Let's optimistic update for speed
                    const comEl = document.createElement('div');
                    comEl.className = 'comment-item';
                    comEl.innerHTML = `<span class="comment-author">You (Faculty)</span> ${text}`;
                    commentsDiv.appendChild(comEl);

                    // Update global count locally too
                    updateHopeCount(res.newCount);

                    // Reset UI
                    input.value = "";
                    input.disabled = false;
                    sendBtn.innerText = "send";
                })
                .withFailureHandler((err) => {
                    alert("Failed to plant support: " + err);
                    input.disabled = false;
                    sendBtn.innerText = "send";
                })
                .postReply(whisper.id, "Faculty (Web)", text);
        });

        grid.appendChild(card);
    });
}

function setupBeacon() {
    const btn = document.getElementById('beacon-btn');
    const modal = document.getElementById('help-modal');
    const close = document.querySelector('.close-modal');

    if (!btn || !modal || !close) return;

    btn.addEventListener('click', () => {
        modal.classList.add('visible');
    });

    close.addEventListener('click', () => {
        modal.classList.remove('visible');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('visible');
        }
    });
}
