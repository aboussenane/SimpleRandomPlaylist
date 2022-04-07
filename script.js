const musicContainer = document.getElementById('music-container');
const playBtn = document.getElementById('play');


const audio = document.getElementById('audio');

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

// Event listeners
playBtn.addEventListener('click', () => {
  const isPlaying = musicContainer.classList.contains('play');

  if (isPlaying) {
    musicContainer.classList.remove('play');
		playBtn.querySelector('i.fas').classList.add('fa-play');
		playBtn.querySelector('i.fas').classList.remove('fa-pause');
		//stop audio

  } 
  else {
   
  	const actx = new (AudioContext || webkitAudioContext)();
			if(!actx) throw 'Not supported :('; //check if browser supports webkit
			
			musicContainer.classList.add('play'); //adds play to classList in html for music container
  		playBtn.querySelector('i.fas').classList.remove('fa-play'); //swaps button icon
  		playBtn.querySelector('i.fas').classList.add('fa-pause');
  		
  		
  		setInterval(function(){rainDrops();}, getRandomInt(2,7)*1000);
  		 playNoise(actx);
  		
	
	}
});

function rainDrops (){
	// raindrop layer - synthesizer 20 ms attack, 120 ms decay, 200 ms delay, triggered at random
		
		

		const rctx =  new (AudioContext || webkitAudioContext)();
		
		
		const osc = rctx.createOscillator(); // create oscillator
		osc.type = 'sine'; //change type
		let rainFreq = getRandomInt(330, 660);
		osc.frequency.value = rainFreq; //change freq
		const ADSR = {attack: 0.3 , decay: 0.5, sustain: 0.1, release: 0.01};
	 
		// create gain, filter, delay node

		var gainNode = rctx.createGain();
		let filter = rctx.createBiquadFilter();
		const delay = rctx.createDelay();
		let delayfilter = rctx.createBiquadFilter();
		const feedback = rctx.createGain();
		const  earlyDelay = rctx.createDelay();
		let ERfilter = rctx.createBiquadFilter();
		let busFilter = rctx.createBiquadFilter();
		var bus = rctx.createGain();
		// osc -> gain -> filter -> output
		//                filter -> delay -> delayfilter -> output
		//                                   delayfilter -> feedback -> delayFilter -> output
		osc.connect(gainNode);
		gainNode.connect(filter);
		filter.connect(busFilter);
		
		filter.connect(delay);
		delay.connect(delayfilter);
		delayfilter.connect(feedback);
		feedback.connect(delay);
		delayfilter.connect(busFilter);

// osc -> filter - > earlyDelay -> output
//                   earlyDelay -> earlyFeedback -> earlyDelay
		filter.connect(earlyDelay);
		earlyDelay.connect(ERfilter);
		ERfilter.connect(busFilter);

		busFilter.connect(bus);
		bus.connect(rctx.destination)
		// ADSR 

		const now = rctx.currentTime;
		const atkDuration = ADSR.attack +getRandomInt(0,0.2);
		const atkEndTime = now + atkDuration;
		const decayDuration = ADSR.decay;

		//modify values
    
    osc.frequency.exponentialRampToValueAtTime(rainFreq*1.033, atkEndTime);
    osc.frequency.exponentialRampToValueAtTime ( rainFreq, atkEndTime + decayDuration + ADSR.release);

		gainNode.gain.setValueAtTime(0.0 , now);
		gainNode.gain.exponentialRampToValueAtTime (0.6 , atkEndTime);
		gainNode.gain.setTargetAtTime( ADSR.sustain , atkEndTime, decayDuration);
		gainNode.gain.linearRampToValueAtTime ( 0.0001, atkEndTime + decayDuration + ADSR.release);

		filter.type = 'lowpass';
		filter.frequency.setValueAtTime(660, now);
		filter.Q.setValueAtTime(1, now);
		filter.Q.setTargetAtTime(4, now, atkEndTime);
		filter.Q.setTargetAtTime(1, atkEndTime, atkEndTime+decayDuration);
		filter.frequency.setTargetAtTime(330, now, atkEndTime+decayDuration);
		filter.detune.setTargetAtTime(20, now,atkEndTime+decayDuration);
		
		delay.delayTime.setValueAtTime(0.6, now);
		
		delayfilter.type = 'lowpass';
		delayfilter.Q = 0.7;
		delayfilter.frequency.setValueAtTime(300, now);
		
		delayfilter.Q.setTargetAtTime(5, now, atkEndTime);
		delayfilter.Q.setTargetAtTime(0.7, atkEndTime, atkEndTime+decayDuration);
		feedback.gain.setValueAtTime(0.5, now);

		earlyDelay.delayTime.setValueAtTime(0.2, now);
		ERfilter.type = 'highpass';
		ERfilter.frequency.setValueAtTime(440, now);

		ERfilter.gain.setValueAtTime(-6, now);

		busFilter.type = 'lowpass';
		busFilter.frequency.setValueAtTime(660, now);

		bus.gain.setValueAtTime(0.02, now);

		//start stop

		osc.start(now);
		
		osc.stop(rctx.currentTime + 2); // stop playing 2 seconds from now
				
}

/*function noise(){
	const ntx = new(window.AudioContext || windoe.webkitAudioContext);
	const bufferSize = 2 * ntx.sampleRate;
	const noiseBuffer = ntx.createBuffer(1, bufferSize, ntx.sampleRate);
	const output = noiseBuffer.getChannelData(0);

		for (let i =0; i< bufferSize; i++){
			output[i] = Math.random() * 2 - 1;
		}


}
*/
var Noise = (function () {

  "use strict";
  if (!supportsES6) {return;}

  const audioContext = new(window.AudioContext || window.webkitAudioContext);
  
  let fadeOutTimer;
  
  // https://noisehack.com/generate-noise-web-audio-api/
  function createNoise(track) {

    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    track.audioSource.buffer = noiseBuffer;
  }

  function stopNoise(track) {
    if (track.audioSource) {
      clearTimeout(fadeOutTimer);
      track.audioSource.stop();
    }
  }
  
  function fadeNoise(track) {
    
    if (track.fadeOut) {
      track.fadeOut = (track.fadeOut >= 0) ? track.fadeOut : 0.5;
    } else {
      track.fadeOut = 0.5;
    }

    if (track.canFade) {
      
      track.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + track.fadeOut);

      track.canFade = false;

      fadeOutTimer = setTimeout(() => {
        stopNoise(track);
      }, track.fadeOut * 1000);

    } else {
      stopNoise(track);
    }

  }

  function buildTrack(track) {
    track.audioSource = audioContext.createBufferSource();
    track.gainNode = audioContext.createGain();
    track.audioSource.connect(track.gainNode);
    track.gainNode.connect(audioContext.destination);
    track.canFade = true; // used to prevent fadeOut firing twice
  }
  
  function setGain(track) {

    track.volume = (track.volume >= 0) ? track.volume : 0.5;
    
    if (track.fadeIn) {
      track.fadeIn = (track.fadeIn >= 0) ? track.fadeIn : 0.5;
    } else {
      track.fadeIn = 0.5;
    }

    track.gainNode.gain.setValueAtTime(0, audioContext.currentTime);

    track.gainNode.gain.linearRampToValueAtTime(track.volume / 4, audioContext.currentTime + track.fadeIn / 2);

    track.gainNode.gain.linearRampToValueAtTime(track.volume, audioContext.currentTime + track.fadeIn);

  }

  function playNoise(track) {

    stopNoise(track);
    buildTrack(track);
    createNoise(track);
    setGain(track);
    track.audioSource.loop = true;
    track.audioSource.start();
  }

  // Expose functions:
  return {
    play : playNoise,
    stop : stopNoise,
    fade : fadeNoise
  }

}());
//*/

/*
var Noise=function(){function d(a){a.audioSource&&(clearTimeout(c),a.audioSource.stop())}if(supportsES6){var b=new (window.AudioContext||window.webkitAudioContext),c;return{play:function(a){d(a);a.audioSource=b.createBufferSource();a.gainNode=b.createGain();a.audioSource.connect(a.gainNode);a.gainNode.connect(b.destination);a.canFade=!0;for(var c=2*b.sampleRate,f=b.createBuffer(1,c,b.sampleRate),g=f.getChannelData(0),e=0;e<c;e++)g[e]=2*Math.random()-1;a.audioSource.buffer=f;a.volume=0<=a.volume?a.volume:
.5;a.fadeIn=a.fadeIn?0<=a.fadeIn?a.fadeIn:.5:.5;a.gainNode.gain.setValueAtTime(0,b.currentTime);a.gainNode.gain.linearRampToValueAtTime(a.volume/4,b.currentTime+a.fadeIn/2);a.gainNode.gain.linearRampToValueAtTime(a.volume,b.currentTime+a.fadeIn);a.audioSource.loop=!0;a.audioSource.start()},stop:d,fade:function(a){a.fadeOut=a.fadeOut?0<=a.fadeOut?a.fadeOut:.5:.5;a.canFade?(a.gainNode.gain.linearRampToValueAtTime(0,b.currentTime+a.fadeOut),a.canFade=!1,c=setTimeout(function(){d(a)},1E3*a.fadeOut)):
d(a)}}}}();
//*/
var noise = {
  volume: 0.05, // 0 - 1
  fadeIn: 2.5, // time in seconds
  fadeOut: 1.3, // time in seconds
}


function pauseSong(){
musicContainer.classList.remove('play');
	playBtn.querySelector('i.fas').classList.add('fa-play');
	playBtn.querySelector('i.fas').classList.remove('fa-pause');
	
	audio.pause();

}






// Change song

// Time/song update
audio.addEventListener('timeupdate', updateProgress);



// Song ends
audio.addEventListener('ended', nextSong);

// Time of song
audio.addEventListener('timeupdate',DurTime);

audio.addEventListener('ended', shuffleNext)