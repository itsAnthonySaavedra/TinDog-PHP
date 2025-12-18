/**
 * Deck Loader
 * Fetches potential matches and populates the swipe deck.
 */

document.addEventListener("DOMContentLoaded", async () => {
    const swipeDeck = document.querySelector(".swipe-deck");
    const noMoreMatches = document.getElementById("no-more-matches");
    const token = DataService.getToken();

    // Modal Elements
    const modalTitle = document.getElementById('profileModalLabel');
    const modalImage = document.getElementById('modal-main-image');
    const modalMeta = document.getElementById('modal-meta-info');
    const modalBio = document.getElementById('modal-bio');

    if (!swipeDeck) return;

    // --- 1. Helper: Card Template ---
    const createCard = (user) => {
        const card = document.createElement("div");
        card.className = "match-card";
        card.dataset.userId = user.id;

        // Correct Mapping for Full User Object
        const name = user.dog_name || user.name || 'Pup';
        const avatarPath = user.dog_avatar || user.avatar || "";
        const breed = user.dog_breed || user.breed || "";
        const age = user.dog_age || user.age || "";

        const imgUrl = avatarPath
            ? DataService.resolvePath(avatarPath)
            : "../../assets/images/default-avatar.png";

        // Distance Logic
        let distanceTxt = "Nearby";
        if (user.distance !== undefined && user.distance !== null) {
            const dist = parseFloat(user.distance);
            if (!isNaN(dist)) {
                distanceTxt = (dist < 1) ? "Nearby" : `${Math.round(dist)} km`;
            }
        }

        card.innerHTML = `
            <img src="${imgUrl}" class="card-img-top" alt="${name}" draggable="false">
            <div class="card-info-overlay">
                <h3 class="card-title mb-0 shadow-text">${name}${age ? `, <span class="fw-light">${age}</span>` : ''}</h3>
                ${breed ? `<p class="card-text mb-2 shadow-text">${breed}</p>` : ''}
                <div class="d-flex align-items-center small shadow-text">
                    <i class="bi bi-geo-alt-fill me-1"></i> ${distanceTxt}
                </div>
                <!-- Info Button prevents triggering swipe -->
                <button class="btn btn-light btn-sm info-button" style="position:absolute; top:1rem; right:1rem; border-radius:50%; width:32px; height:32px; z-index:10;" type="button">
                    <i class="bi bi-info-lg"></i>
                </button>
            </div>
            <div class="stamp like">LIKE</div>
            <div class="stamp dislike">NOPE</div>
        `;
        return card;
    };

    // --- 2. Input Logic: Fetch & Progressive Resolve ---
    // --- 2. Input Logic: RACE for Speed ---
    const fetchMatches = async () => {
        const reqOpts = { headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" } };

        // Helper to normalize data from different endpoints
        const normalize = (source, data) => {
            if (source === 'primary' && Array.isArray(data)) return data;
            if (source === 'fallback' && data && Array.isArray(data.pupsNearby)) {
                return data.pupsNearby.map(p => ({
                    id: p.id,
                    name: p.dog_name || p.name,
                    avatar: p.dog_avatar || p.avatar,
                    distance: p.distance,
                    // Mark as needing robust enrichment
                    _needs_enrich: true
                }));
            }
            return [];
        };

        try {
            // We want the FIRST valid response, not waiting for all.
            // Primary: The Discovery Algorithm (Haversine distance, unswiped users)
            const primaryPromise = fetch(`http://127.0.0.1:8000/api/discovery?t=${Date.now()}`, reqOpts)
                .then(async r => {
                    if (!r.ok) throw r.status;
                    const j = await r.json();
                    if (!j.success) throw 'api failure';
                    const list = normalize('primary', j.data);
                    if (list.length === 0) throw 'empty list';
                    return list;
                });

            const fallbackPromise = fetch(`http://127.0.0.1:8000/api/user/dashboard?t=${Date.now()}`, reqOpts)
                .then(async r => {
                    if (!r.ok) throw r.status;
                    const j = await r.json();
                    if (!j.success) throw 'api failure';
                    const list = normalize('fallback', j.data);
                    if (list.length === 0) throw 'empty list';
                    return list;
                });

            return await Promise.any([primaryPromise, fallbackPromise]);

        } catch (aggregateError) {
            console.warn("All match fetch strategies failed or returned empty.", aggregateError);
            // Force logout if we see 401s in the error
            if (aggregateError && (aggregateError === 401 || (aggregateError.errors && aggregateError.errors.includes(401)))) {
                alert("Session timed out. Please login again.");
                window.location.href = '../../auth/index.html';
            }
            return [];
        }
    };



    // --- 4. Background Enrichment ---
    const backgroundEnrich = async (cards) => {
        // Enriches cards that were rendered before having full data
        const enrichOne = async (card) => {
            const userId = card.dataset.userId;
            if (!userId) return;
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success) {
                    const u = json.data;
                    const realName = u.dog_name || u.name || 'Dog';
                    const realAge = u.dog_age || u.age || '';
                    const realBreed = u.dog_breed || u.breed || '';
                    const realAvatar = u.dog_avatar || u.avatar;

                    const titleEl = card.querySelector('.card-title');
                    const textEl = card.querySelector('.card-text');
                    const imgEl = card.querySelector('img');

                    if (titleEl) titleEl.innerHTML = `${realName}${realAge ? `, <span class="fw-light">${realAge}</span>` : ''}`;
                    if (realBreed) {
                        if (textEl) {
                            textEl.textContent = realBreed;
                        } else {
                            const p = document.createElement('p');
                            p.className = 'card-text mb-2 shadow-text';
                            p.textContent = realBreed;
                            titleEl.parentNode.insertBefore(p, titleEl.nextSibling);
                        }
                    }
                    if (realAvatar && imgEl) {
                        imgEl.src = DataService.resolvePath(realAvatar);
                    }
                }
            } catch (err) { }
        };

        // Process sequentially to be kind to network
        for (const card of cards) {
            // Only needing enrichment
            if (!card.dataset.enriched) {
                await enrichOne(card);
                card.dataset.enriched = "true";
            }
        }
    };

    // --- 5. Main Execution ---
    try {
        // A. Show Skeleton Card IMMEDIATELY (UX Fix)
        const skeletonCard = document.createElement('div');
        skeletonCard.className = 'match-card';
        skeletonCard.style.zIndex = 0; // Behind real cards
        skeletonCard.innerHTML = `
            <div class="skeleton skeleton-img" style="height: 100%;"></div>
            <div class="card-info-overlay">
                 <div class="skeleton skeleton-text w-50" style="height: 2rem; margin-bottom: 0.5rem;"></div>
                 <div class="skeleton skeleton-text w-75"></div>
                 <div class="d-flex align-items-center mt-2">
                     <div class="skeleton skeleton-text w-25"></div>
                 </div>
            </div>
        `;
        swipeDeck.appendChild(skeletonCard);

        // B. Start Fetching
        let matches = await fetchMatches();

        // C. Clear Skeleton
        swipeDeck.removeChild(skeletonCard);

        if (matches.length === 0) {
            if (noMoreMatches) noMoreMatches.style.display = "flex";
            return;
        }

        if (noMoreMatches) noMoreMatches.style.display = "none";

        const fragment = document.createDocumentFragment();
        // Reverse for stack order
        matches.slice(0, 10).reverse().forEach(user => {
            const card = createCard(user);
            // We mark them as NOT enriched initially since we removed the pre-fetch
            if (user._enriched) card.dataset.enriched = "true";
            fragment.appendChild(card);
        });
        swipeDeck.appendChild(fragment);

        // Bind Events
        swipeDeck.addEventListener('click', (e) => {
            const btn = e.target.closest('.info-button');
            if (btn) {
                e.stopPropagation();
                const card = btn.closest('.match-card');
                if (card && card.dataset.userId && window.ProfileModal) {
                    window.ProfileModal.open(card.dataset.userId);
                }
            }
        });

        // Ensure DOM is painted and listeners are ready
        setTimeout(() => {
            console.log("Deck Loader: Dispatching deckPopulated");
            document.dispatchEvent(new Event("deckPopulated"));
        }, 100);

        // Trigger background enrichment for ALL cards to fill in details
        const unenrichedCards = Array.from(swipeDeck.querySelectorAll('.match-card'));
        if (unenrichedCards.length > 0) {
            backgroundEnrich(unenrichedCards);
        }

    } catch (e) {
        console.error("Deck Loader Main Error", e);
        // Ensure skeleton is gone if error
        const skel = swipeDeck.querySelector('.match-card .skeleton');
        if (skel) swipeDeck.innerHTML = '';

        if (noMoreMatches) noMoreMatches.style.display = "flex";
    }
});
