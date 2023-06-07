var jru = document.getElementById('jrudesc');
var pera = document.getElementById('perakladicf');
var slrvita = document.getElementById('slrvita');
var rft = document.getElementById('raft');

var tw1 = new Typewriter(jru, {
  loop: false,
  delay: 75,
  autoStart: true,
  cursor: '█',
  strings: ["A site which is dedicated to playing Jackbox Games on russian language. I worked on the localization part."]
});

var tw2 = new Typewriter(pera, {
    loop: false,
    delay: 75,
    autoStart: true,
    cursor: '█',
    strings: ["Site I wrote to distrube my own game localizations for belarusian language. Made with React and one hella broken header script."]
  });


var tw3 = new Typewriter(slrvita, {
    loop: false,
    delay: 75,
    autoStart: true,
    cursor: '█',
    strings: ["A port of an open-source game called Slenderman Returns for the PlayStation Vita. Includes a custom-made english localization from italian."]
  });

  var tw4 = new Typewriter(raft, {
    loop: false,
    delay: 75,
    autoStart: true,
    cursor: '█',
    strings: ["A port of a demo version of Raft for PlayStation Vita published on itch.io."]
  });

