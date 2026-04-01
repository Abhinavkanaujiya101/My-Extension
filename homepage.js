/**
 * NEXUS OS V5.3 - PURPLE/GLASS EDITION
 */

const grid = document.getElementById('link-grid');
const addBtn = document.getElementById('add-link-btn');

function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

async function initAnalytics() {
    // 1. Battery System (r=65 -> circ ~408.4)
    if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        const refresh = () => {
            const lvl = battery.level;
            document.getElementById('battery-percent').textContent = Math.round(lvl * 100) + "%";
            document.getElementById('battery-ring').style.strokeDashoffset = 408.4 - (lvl * 408.4);
        };
        refresh();
        battery.onlevelchange = refresh;
    }

    // 2. Thermal & Location (r=48 -> circ ~301.6)
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const data = await res.json();
            const temp = Math.round(data.current_weather.temperature);
            
            document.getElementById('local-temp').textContent = temp + "°C";
            document.getElementById('loc-ring').style.strokeDashoffset = 301.6 - (Math.min(temp / 50, 1) * 301.6);

            const geo = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const geoData = await geo.json();
            document.getElementById('location-label').textContent = (geoData.city || "LOCAL").toUpperCase();
        } catch (e) { console.error("Sync error"); }
    }, () => {
        document.getElementById('location-label').textContent = "OFFLINE";
    });
}

function createCard(url, name) {
    const domain = new URL(url).hostname;
    const card = document.createElement('a');
    card.href = url;
    card.className = "flex items-center gap-6 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/15 transition-all group backdrop-blur-md";
    card.innerHTML = `<img src="https://www.google.com/s2/favicons?sz=128&domain=${domain}" class="w-8 h-8 grayscale group-hover:grayscale-0 transition-all">
                      <span class="text-xs font-black text-white uppercase opacity-40 group-hover:opacity-100 tracking-widest">${name}</span>`;
    grid.appendChild(card);
}

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
    initAnalytics();

    const defaults = [{name: "GitHub", url: "https://github.com"}, {name: "YouTube", url: "https://youtube.com"}];
    chrome.storage.local.get(['myLinks'], (data) => {
        (data.myLinks || defaults).forEach(n => createCard(n.url, n.name));
    });
});

addBtn.addEventListener('click', () => {
    const name = prompt("Node Name:");
    const url = prompt("Target URL:");
    if (name && url) {
        chrome.storage.local.get(['myLinks'], (d) => {
            const list = d.myLinks || [];
            list.push({name, url: url.includes('://') ? url : 'https://'+url});
            chrome.storage.local.set({myLinks: list}, () => location.reload());
        });
    }
});