var app = document.getElementById('app');

var typewriter = new Typewriter(app, {
  loop: true,
  delay: 75,
  autoStart: true,
  cursor: '█',
  strings: ["Hi! I'm Bur, but you probably know me under the username BurAndBY", "I've worked on different sites. You can find them in the /mysites", "I'm also a big retro geek, that's why this site ended up looking like this"]
});