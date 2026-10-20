// FOB Send to the Crew Sharing (PRD Section 19: FR-20, 23.5)

export function initShare() {
  document.addEventListener("click", async (e) => {
    const shareBtn = e.target.closest(".fob-share-btn");
    if (!shareBtn) return;

    e.preventDefault();
    const title = shareBtn.dataset.shareTitle || "FOB Lagos • Bring your crew";
    const text = shareBtn.dataset.shareText || "Check out FOB recreational centre in Lagos! Bring your crew.";
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if (err.name === "AbortError") return; // User cancelled
      }
    }

    // Fallback: WhatsApp direct share
    const shareMessage = `${title}\n\n${text}\n\n${url}`;
    const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(waShareUrl, "_blank", "noopener,noreferrer");
  });
}
