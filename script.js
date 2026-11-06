"use strict";

const invitation = document.getElementById("invitation");
const confirmation = document.getElementById("confirmation");
const yesButton = document.getElementById("yes-button");
const noButton = document.getElementById("no-button");
const actions = document.getElementById("actions");
const particleContainer = document.getElementById("heart-particles");
const responseStatus = document.getElementById("response-status");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let yesScale = 1;
let accepted = false;
let roaming = false;
let resizeFrame;

const heartSVG = '<svg viewBox="0 0 24 24"><path d="M12 21S2 15 2 8.5C2 3 8.8 1.8 12 6.7 15.2 1.8 22 3 22 8.5 22 15 12 21 12 21Z"/></svg>';

function viewportBounds() {
  const viewport = window.visualViewport;
  return {
    left: viewport ? viewport.offsetLeft : 0,
    top: viewport ? viewport.offsetTop : 0,
    width: viewport ? viewport.width : document.documentElement.clientWidth,
    height: viewport ? viewport.height : window.innerHeight,
  };
}

function fitYesButton(requestedScale = yesScale) {
  const maxScale = actions.getBoundingClientRect().width / yesButton.offsetWidth;
  yesScale = Math.min(requestedScale, maxScale);
  yesButton.style.setProperty("--yes-scale", String(yesScale));
  // Transforms do not reserve space, so keep the growing button in the layout.
  actions.style.minHeight = `${Math.ceil(yesButton.offsetHeight * yesScale)}px`;
}

function centerYesButton() {
  const previous = noButton.getBoundingClientRect();
  noButton.classList.add("is-roaming");
  noButton.style.left = `${previous.left}px`;
  noButton.style.top = `${previous.top}px`;
  // The agreement row spans both desktop columns and remains centered on mobile.
  invitation.appendChild(noButton);
  actions.querySelector(".no-slot").hidden = true;
  actions.classList.add("is-centered");
  invitation.appendChild(actions);
}

function moveNoButton() {
  if (accepted) return;
  const previous = noButton.getBoundingClientRect();
  noButton.classList.add("is-roaming");
  roaming = true;

  const bounds = viewportBounds();
  const padding = 22;
  const width = noButton.offsetWidth;
  const height = noButton.offsetHeight;
  const minX = bounds.left + padding;
  const minY = bounds.top + padding;
  const maxX = Math.max(minX, bounds.left + bounds.width - width - padding);
  const maxY = Math.max(minY, bounds.top + bounds.height - height - padding);
  const row = actions.getBoundingClientRect();
  const currentYes = yesButton.getBoundingClientRect();
  const centerX = row.left + row.width / 2;
  const centerY = row.top + row.height / 2;
  // Avoid both the current button and its final size while it animates.
  const yes = {
    left: Math.min(currentYes.left, centerX - yesButton.offsetWidth * yesScale / 2) - 14,
    right: Math.max(currentYes.right, centerX + yesButton.offsetWidth * yesScale / 2) + 14,
    top: Math.min(currentYes.top, centerY - yesButton.offsetHeight * yesScale / 2) - 14,
    bottom: Math.max(currentYes.bottom, centerY + yesButton.offsetHeight * yesScale / 2) + 14,
  };
  let destination;
  let bestDistance = -1;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    const overlapsYes = x < yes.right && x + width > yes.left && y < yes.bottom && y + height > yes.top;
    if (overlapsYes) continue;
    const distance = Math.hypot(x - previous.left, y - previous.top);
    if (distance > bestDistance) {
      bestDistance = distance;
      destination = { x, y };
    }
    if (distance > Math.min(150, bounds.width * .35)) break;
  }

  // Even on a very small viewport the refusal stays reachable.
  destination ||= { x: Math.random() < .5 ? minX : maxX, y: yes.top > bounds.top + bounds.height / 2 ? minY : maxY };
  noButton.style.left = `${Math.round(destination.x)}px`;
  noButton.style.top = `${Math.round(destination.y)}px`;
}

noButton.addEventListener("click", () => {
  if (accepted) return;
  if (!roaming) centerYesButton();
  fitYesButton(yesScale * 1.1);
  moveNoButton();
});

function celebrate(origin) {
  if (reducedMotion.matches) return;
  const colors = ["#a83242", "#ca6a77", "#db98a0", "#bc7c57", "#e5b9b8"];
  const fragment = document.createDocumentFragment();
  const hearts = [];
  for (let index = 0; index < 62; index += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.style.setProperty("--size", `${10 + Math.random() * 22}px`);
    particle.style.setProperty("--color", colors[index % colors.length]);
    particle.innerHTML = heartSVG;
    fragment.appendChild(particle);
    hearts.push(particle);
  }
  particleContainer.appendChild(fragment);

  hearts.forEach((particle, index) => {
    const angle = -Math.PI + Math.random() * Math.PI;
    const distance = 180 + Math.random() * Math.min(window.innerWidth, 750);
    const endX = origin.x + Math.cos(angle) * distance;
    const peakY = origin.y + Math.sin(angle) * distance - 80;
    const spin = Math.random() * 360 - 180;
    const animation = particle.animate([
      { transform: `translate(${origin.x}px, ${origin.y}px) rotate(0deg) scale(.2)`, opacity: 0 },
      { opacity: 1, offset: .1 },
      { transform: `translate(${endX}px, ${peakY}px) rotate(${spin}deg) scale(1)`, opacity: .95, offset: .55 },
      { transform: `translate(${endX + (Math.random() - .5) * 150}px, ${window.innerHeight + 70}px) rotate(${spin * 2}deg) scale(.65)`, opacity: 0 },
    ], { duration: 2100 + Math.random() * 1700, delay: index * 13, easing: "cubic-bezier(.2,.6,.4,1)", fill: "both" });
    animation.onfinish = () => particle.remove();
  });
}

yesButton.addEventListener("click", () => {
  if (accepted) return;
  accepted = true;
  const button = yesButton.getBoundingClientRect();
  celebrate({ x: Math.min(window.innerWidth - 30, Math.max(30, button.left + button.width / 2)), y: Math.min(window.innerHeight * .75, Math.max(60, button.top + button.height / 2)) });
  invitation.hidden = true;
  confirmation.hidden = false;
  document.body.classList.add("has-accepted");
  document.title = "7 ноября. У нас с тобой свидание ♡";
  responseStatus.textContent = "Отлично, тогда жду тебя готовой в 13:50";
  window.scrollTo({ top: 0, behavior: "instant" });
  document.getElementById("confirmation-title").focus({ preventScroll: true });
  if (!reducedMotion.matches) {
    confirmation.animate([
      { opacity: 0, transform: "translateY(20px) scale(.97)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ], { duration: 650, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" });
    const heart = confirmation.querySelector(".confirmation-heart");
    heart.animate([{ transform: "scale(.7) rotate(-12deg)" }, { transform: "scale(1.1) rotate(5deg)", offset: .65 }, { transform: "scale(1) rotate(0)" }], { duration: 900, easing: "ease-out" });
  }
});

function keepButtonsVisible() {
  if (!roaming || accepted) return;
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    // A smaller viewport must clamp immediately, without an overflowing transition.
    yesButton.style.transition = "none";
    fitYesButton();
    yesButton.getBoundingClientRect();
    yesButton.style.removeProperty("transition");
    const bounds = viewportBounds();
    const rect = noButton.getBoundingClientRect();
    const margin = 22;
    const maxX = Math.max(bounds.left + margin, bounds.left + bounds.width - rect.width - margin);
    const maxY = Math.max(bounds.top + margin, bounds.top + bounds.height - rect.height - margin);
    noButton.style.left = `${Math.min(maxX, Math.max(bounds.left + margin, rect.left))}px`;
    noButton.style.top = `${Math.min(maxY, Math.max(bounds.top + margin, rect.top))}px`;
  });
}

window.addEventListener("resize", keepButtonsVisible);
window.visualViewport?.addEventListener("resize", keepButtonsVisible);
window.visualViewport?.addEventListener("scroll", keepButtonsVisible);
