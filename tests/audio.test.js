import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio, BOING_SOUNDS, FART_SOUNDS } from '../src/audio.js';

const ALL_SOUNDS = [...BOING_SOUNDS, ...FART_SOUNDS];

function audioHarness(t, { fetchClip, decodeClip } = {}) {
  const originalContext = globalThis.AudioContext;
  const originalFetch = globalThis.fetch;
  const tones = [], clips = [], requests = [], gains = [];
  class FakeAudioContext {
    state = 'suspended';
    currentTime = 2;
    destination = {};
    async resume() { this.state = 'running'; }
    async suspend() { this.state = 'suspended'; }
    async decodeAudioData(data) { return decodeClip ? decodeClip(data) : { sound: data }; }
    createOscillator() {
      const tone = { frequencies: [], type: '', connect() {}, disconnect() {}, start(at) { this.started = at; }, stop(at) { this.stopped = at; } };
      tone.frequency = { setValueAtTime: (value, time) => tone.frequencies.push([value, time]), exponentialRampToValueAtTime: (value, time) => tone.frequencies.push([value, time]) };
      tones.push(tone);
      return tone;
    }
    createBufferSource() {
      const source = { connect() {}, disconnect() { this.disconnected = true; }, start() { this.started = true; }, stop() { this.stopped = true; this.onended?.(); } };
      clips.push(source);
      return source;
    }
    createGain() {
      const gain = { values: [], gain: { setValueAtTime: value => gain.values.push(value), linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} };
      gains.push(gain);
      return gain;
    }
  }
  globalThis.AudioContext = FakeAudioContext;
  globalThis.fetch = async sound => {
    requests.push(sound);
    if (fetchClip) return fetchClip(sound);
    return { ok: true, arrayBuffer: async () => sound };
  };
  t.after(() => { globalThis.AudioContext = originalContext; globalThis.fetch = originalFetch; });
  return { tones, clips, requests, gains };
}

test('audio is opt-in, only celebration music is synthesized, mute stops all sounds', async t => {
  const { tones, clips, requests } = audioHarness(t);
  const audio = new GameAudio();
  await audio.boing();
  await audio.fart();
  assert.equal(tones.length, 0);
  assert.equal(clips.length, 0);
  assert.equal(requests.length, 0, 'no clips fetched before sound is enabled');
  assert.equal(audio.context, null);
  assert.equal(await audio.toggle(), true);
  assert.equal(audio.context.state, 'running');
  await audio.boing();
  assert.equal(clips.length, 1);
  assert.equal(tones.length, 0);
  audio.celebrate();
  assert.equal(tones.length, 5);
  assert.ok(tones.every(tone => tone.type === 'sine' && tone.stopped > tone.started));
  assert.equal(await audio.toggle(), false);
  await audio.boing();
  await audio.fart();
  audio.celebrate();
  assert.equal(clips.length, 1);
  assert.equal(clips[0].stopped, true);
  assert.equal(tones.length, 5);
  assert.equal(audio.context.state, 'suspended');
});

for (const [kind, sounds] of [['boing', BOING_SOUNDS], ['fart', FART_SOUNDS]]) {
  test(`random ${kind} selection plays every MP3, caches clips, and cleans up sources`, async t => {
    const { tones, clips, requests, gains } = audioHarness(t);
    const choices = sounds.map((_, index) => index / sounds.length);
    choices.push(.99999, 0);
    const audio = new GameAudio({ random: () => choices.shift() });
    await audio.toggle();
    for (let index = 0; index < sounds.length + 2; index++) await audio[kind]();
    assert.ok(clips.every(clip => clip.started));
    assert.deepEqual(clips.map(clip => clip.buffer.sound), [...sounds, sounds.at(-1), sounds[0]]);
    assert.deepEqual(sounds.map(sound => new URL(sound).pathname.split('/').at(-1)), Array.from({ length: kind === 'boing' ? 3 : 5 }, (_, index) => `${kind}${index + 1}.mp3`));
    assert.deepEqual(requests, ALL_SOUNDS, 'each MP3 is loaded once, not per wiggle/rescue');
    assert.equal(tones.length, 0, 'effects use recorded clips, not oscillator tones');
    assert.ok(gains.every(gain => gain.values[0] === .25));
    clips[0].onended();
    assert.equal(audio.clipSources.size, sounds.length + 1);
    assert.equal(clips[0].disconnected, true);
    audio.stop();
    assert.ok(clips.slice(1).every(clip => clip.stopped));
    assert.equal(audio.clipSources.size, 0);
    assert.equal(audio.context.state, 'suspended');
    await audio.unlock();
    assert.deepEqual(requests, ALL_SOUNDS, 'resuming reuses the decoded cache');
    assert.equal(clips.length, sounds.length + 2, 'resume never starts an old effect again');
  });
}

test('muting and pausing cancel in-flight loads, even if sound is resumed before they finish', async t => {
  let finishDownload;
  const pending = new Promise(resolve => { finishDownload = resolve; });
  const { clips } = audioHarness(t, { fetchClip: async () => ({ ok: true, arrayBuffer: () => pending }) });
  const audio = new GameAudio({ random: () => 0 });
  await audio.toggle();
  const beforeMute = [audio.boing(), audio.fart()];
  await audio.toggle();
  await audio.toggle();
  const beforePause = [audio.boing(), audio.fart()];
  audio.stop();
  await audio.unlock();
  finishDownload('downloaded clip');
  await Promise.all([...beforeMute, ...beforePause]);
  assert.equal(clips.length, 0, 'stale wiggles/rescues do not play after loading');
  await Promise.all([audio.boing(), audio.fart()]);
  assert.equal(clips.length, 2, 'fresh effects still play');
  await audio.toggle();
  assert.ok(clips.every(clip => clip.stopped), 'muting immediately stops active recordings');
  await Promise.all([audio.boing(), audio.fart()]);
  assert.equal(clips.length, 2, 'muted wiggles/rescues are silent');
});

test('missing, failed and undecodable clips are harmless and do not block other clips', async t => {
  const { clips } = audioHarness(t, {
    fetchClip: async sound => {
      if ([BOING_SOUNDS[0], FART_SOUNDS[0]].includes(sound)) return { ok: false };
      if ([BOING_SOUNDS[1], FART_SOUNDS[1]].includes(sound)) throw new Error('Network failure');
      return { ok: true, arrayBuffer: async () => sound };
    },
    decodeClip: async sound => {
      if (sound === FART_SOUNDS[2]) throw new Error('Invalid MP3');
      return { sound };
    },
  });
  let index = 0;
  let count = 3;
  const audio = new GameAudio({ random: () => index++ / count });
  await audio.toggle();
  for (let i = 0; i < 3; i++) await audio.boing();
  index = 0;
  count = 5;
  for (let i = 0; i < 5; i++) await audio.fart();
  assert.deepEqual(clips.map(clip => clip.buffer.sound), [BOING_SOUNDS[2], ...FART_SOUNDS.slice(3)]);
  assert.equal(audio.enabled, true);
});
