let items = [];
const params = new URLSearchParams(window.location.search);

// DOM Elements
const playerGrid = document.getElementById("playerGrid");
const opponentGrid = document.getElementById("opponentGrid");
const playerTotal = document.getElementById("playerTotal");
const opponentTotal = document.getElementById("opponentTotal");

// Trade Status Box Elements
const statusBox = document.getElementById("tradeStatusBox");
const statusTitle = document.getElementById("statusTitle");
const statusDiff = document.getElementById("statusDiff");
const playerCol = document.getElementById("player");
const opponentCol = document.getElementById("opponent");

const modal = document.getElementById("itemModal");
const modalItems = document.getElementById("modalItems");
const searchInput = document.getElementById("searchInput");
const closeModal = document.getElementById("closeModal");
const itemCountEl = document.querySelector(".item-count");
const sortButtonsContainer = document.querySelector('.sort-bar');

const playerSlots = [];
const opponentSlots = [];
let currentSlot = null;

// تحميل البيانات من JSON
fetch('items.json')
    .then(r => r.json())
    .then(d => {
        items = d;
        createSlotsUI();
        createSortButtons();
    })
    .catch(err => console.error(err));

// إنشاء الـ Slots
function createSlotsUI() {
    createSlots(playerGrid, playerSlots);
    createSlots(opponentGrid, opponentSlots);
}

function createSlots(grid, arr) {
    grid.innerHTML = "";
    for (let i = 0; i < 12; i++) {
        const slot = document.createElement("div");
        slot.classList.add("slot");
        slot.innerHTML = '<div class="plus">+</div>';
        grid.appendChild(slot);
        arr.push(slot);

        slot.addEventListener("click", e => {
            e.stopPropagation();
            if (slot.dataset.item) {
                slot.innerHTML = '<div class="plus">+</div>';
                delete slot.dataset.item;
                delete slot.dataset.value;
                delete slot.dataset.demand;
                delete slot.dataset.trend;
                updateTotals();
            } else {
                openModal(slot);
            }
        });
    }
}

// فتح المودال
function openModal(slot) {
    currentSlot = slot;
    searchInput.value = "";
    renderItems(items);
    modal.style.display = "flex";
    requestAnimationFrame(() => {
        modal.classList.add('active');
        modal.classList.remove('closing');
    });
}

closeModal.onclick = () => {
    modal.classList.add('closing');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = "none", 350);
};

modal.onclick = e => {
    if (e.target === modal) {
        modal.classList.add('closing');
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = "none", 350);
    }
};

// تحويل حالة الـ Trend إلى أيقونة (سهم)
function getTrendIcon(trend) {
    if(trend === "rising") return "<span style='color:#00ff00; font-size:0.8rem;'>⬆️</span>";
    if(trend === "dropping") return "<span style='color:#ff4c4c; font-size:0.8rem;'>⬇️</span>";
    return "<span style='color:#7bc4ff; font-size:0.8rem;'>➡️</span>"; // stable
}

// عرض العناصر داخل المودال (مُحدثة بالطلب والاتجاه)
function renderItems(list) {
    modalItems.innerHTML = "";
    itemCountEl.textContent = list.length;

    list.forEach(it => {
        const div = document.createElement("div");
        div.className = "modal-item";
        
        // التحقق من وجود القيم احتياطياً
        const itemDemand = it.demand || 0;
        const itemTrend = it.trend || "stable";

        div.innerHTML = `
            <div class="item-indicators">
                <div class="demand-badge">🔥 ${itemDemand}/10</div>
                <div class="trend-badge">${getTrendIcon(itemTrend)}</div>
            </div>
            <img src="${it.img}">
            <div class="item-name">${it.name}</div>
            <div class="item-value">${formatNumber(it.value)}</div>
        `;
        div.onclick = () => {
            selectItem(currentSlot, it);
            modal.classList.add('closing');
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = "none", 350);
        };
        modalItems.appendChild(div);
    });
}

function selectItem(slot, it) {
    const itemDemand = it.demand || 0;
    const itemTrend = it.trend || "stable";

    slot.innerHTML = `
        <img class="item-image" src="${it.img}">
        <div class="item-indicators">
            <div class="demand-badge">🔥 ${itemDemand}/10</div>
            <div class="trend-badge">${getTrendIcon(itemTrend)}</div>
        </div>
        <div class="item-info-bar">
            <div class="item-name">${it.name}</div>
            <div class="item-value">${formatNumber(it.value)}</div>
        </div>
    `;
    slot.dataset.item = it.name;
    slot.dataset.value = it.value;
    slot.dataset.demand = itemDemand;
    slot.dataset.trend = itemTrend;
    updateTotals();
}

// البحث
searchInput.addEventListener("input", () => {
    const v = searchInput.value.toLowerCase();
    renderItems(items.filter(i => i.name.toLowerCase().includes(v)));
});

// الحسابات والمنطق الذكي (مُحدثة بالكامل)
function updateTotals() {
    const pt = playerSlots.reduce((a, v) => a + (parseInt(v.dataset.value) || 0), 0);
    const ot = opponentSlots.reduce((a, v) => a + (parseInt(v.dataset.value) || 0), 0);
    
    playerTotal.textContent = `Total: ${formatNumber(pt)}`;
    opponentTotal.textContent = `Total: ${formatNumber(ot)}`;

    // إعادة تعيين الإضاءة
    playerCol.classList.remove('glow-win', 'glow-lose', 'glow-fair');
    opponentCol.classList.remove('glow-win', 'glow-lose', 'glow-fair');
    statusTitle.style.color = 'white';

    // حالة الصفر (لا توجد عناصر)
    if (pt === 0 && ot === 0) {
        statusTitle.textContent = "-";
        statusDiff.textContent = "Add items";
        statusBox.style.borderColor = "#162447";
        statusBox.style.boxShadow = "0 4px 10px rgba(0,0,0,0.5)";
        return;
    }

    const diff = ot - pt; // الفارق (إذا كان ot أكبر من pt، اللاعب يربح)
    const absDiff = Math.abs(diff);
    const maxTotal = Math.max(pt, ot);
    
    // تحديد نسبة العرض العادل (مثلاً الفارق أقل من 10% يعتبر عادلاً)
    const isFair = absDiff <= (maxTotal * 0.1);

    if (isFair) {
        statusTitle.textContent = "FAIR";
        statusTitle.style.color = "#ffdf5d"; // أصفر ذهبي
        statusDiff.textContent = `Diff: ${diff === 0 ? '0' : (diff > 0 ? '+' : '-') + formatNumber(absDiff)}`;
        
        playerCol.classList.add('glow-fair');
        opponentCol.classList.add('glow-fair');
        statusBox.style.borderColor = "#ffdf5d";
        statusBox.style.boxShadow = "0 0 20px rgba(255, 223, 93, 0.3)";
    } 
    else if (pt > ot) {
        // اللاعب يدفع أكثر مما يأخذ -> خسارة
        statusTitle.textContent = "LOSE";
        statusTitle.style.color = "#ff4c4c"; // أحمر
        statusDiff.textContent = `Diff: -${formatNumber(absDiff)}`;
        
        playerCol.classList.add('glow-lose');
        opponentCol.classList.add('glow-win'); // الخصم هو المستفيد
        statusBox.style.borderColor = "#ff4c4c";
        statusBox.style.boxShadow = "0 0 20px rgba(255, 76, 76, 0.4)";
    } 
    else {
        // اللاعب يأخذ أكثر مما يدفع -> فوز
        statusTitle.textContent = "WIN";
        statusTitle.style.color = "#00ff00"; // أخضر
        statusDiff.textContent = `Diff: +${formatNumber(absDiff)}`;
        
        playerCol.classList.add('glow-win');
        opponentCol.classList.add('glow-lose'); // الخصم هو الخاسر
        statusBox.style.borderColor = "#00ff00";
        statusBox.style.boxShadow = "0 0 20px rgba(0, 255, 0, 0.4)";
    }
}

// أزرار التصنيف
function createSortButtons() {
    const types = [
        { label: "All", key: "all" },
        { label: "Breathing", key: "breathing" },
        { label: "Demon Art", key: "demon" },
        { label: "Game Pass & Perms", key: "gamepasses" }
    ];

    sortButtonsContainer.innerHTML = "";
    types.forEach(t => {
        const btn = document.createElement("button");
        btn.textContent = t.label;
        btn.dataset.sort = t.key;
        btn.style.cssText = "flex:1; padding:5px; border-radius:6px; border:1px solid #ffdf5d; background:#162447; color:white; cursor:pointer;";
        btn.addEventListener('click', () => {
            let filtered = [];
            if (t.key === "all") filtered = items;
            else if (t.key === "breathing") filtered = items.filter(i => i.category.toLowerCase() === "breathing");
            else if (t.key === "demon") filtered = items.filter(i => i.category.toLowerCase() === "demon");
            else if (t.key === "gamepasses") filtered = items.filter(i => i.category.toLowerCase().includes("gamepasses"));
            renderItems(filtered);
        });
        sortButtonsContainer.appendChild(btn);
    });
}

// تحويل الأرقام
function formatNumber(num) {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
}
// زر تفريغ الحسبة
const clearTradeBtn = document.getElementById("clearTradeBtn");

clearTradeBtn.addEventListener("click", () => {
    // دمج مصفوفتي اللاعب والخصم لتسهيل التكرار
    const allSlots = [...playerSlots, ...opponentSlots];
    
    allSlots.forEach(slot => {
        // إعادة الشكل الافتراضي
        slot.innerHTML = '<div class="plus">+</div>';
        
        // مسح جميع البيانات المخزنة
        delete slot.dataset.item;
        delete slot.dataset.value;
        delete slot.dataset.demand;
        delete slot.dataset.trend;
    });
    
    // استدعاء دالة التحديث لإعادة الأرقام والألوان لحالة الصفر
    updateTotals();
});
// Floating Sidebar Logic
document.addEventListener('DOMContentLoaded', () => {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const floatingSidebar = document.getElementById('floatingSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  function toggleSidebar() {
    const isOpen = floatingSidebar.classList.toggle('is-open');
    sidebarBackdrop.classList.toggle('is-active', isOpen);
  }

  function closeSidebar() {
    floatingSidebar.classList.remove('is-open');
    sidebarBackdrop.classList.remove('is-active');
  }

  if (sidebarToggle && floatingSidebar && sidebarBackdrop) {
    sidebarToggle.addEventListener('click', toggleSidebar);
    sidebarBackdrop.addEventListener('click', closeSidebar);
  }
});
