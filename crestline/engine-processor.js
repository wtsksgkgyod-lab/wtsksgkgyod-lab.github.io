// Waveguide-style engine: a firing pulse into a short feedback pipe.
// Original code. The shape of the idea (pulse + delay-line exhaust) is the
// same family as Antonio-R1/engine-sound-generator, which is MIT licensed.
// This file is not a copy of that source.

class CrestlineEngine extends AudioWorkletProcessor {
  constructor(options) {
    super()
    const o = (options && options.processorOptions) || {}
    this.pulses = o.pulses || 4
    this.uneven = !!o.uneven
    this.pipeLen = Math.max(48, o.pipe | 0 || 180)
    this.bright = o.brightness == null ? 0.6 : o.brightness
    this.delay = new Float32Array(4096)
    this.di = 0
    this.phase = 0
    this.step = 0
    this.lp = 0
    this.tone = 0
    this.popCool = 0
    // V10: five uneven combustion events per revolution. Flat-six: three even.
    this.pattern = this.pulses === 5
      ? [0.94, 1.08, 0.9, 1.12, 0.96]
      : [1, 1, 1]
    let sum = 0
    for (let i = 0; i < this.pattern.length; i++) sum += this.pattern[i]
    for (let i = 0; i < this.pattern.length; i++) this.pattern[i] = (this.pattern[i] * this.pulses) / sum
  }

  static get parameterDescriptors() {
    return [
      { name: 'rpm', defaultValue: 3000, minValue: 0, maxValue: 20000, automationRate: 'k-rate' },
      { name: 'throttle', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    ]
  }

  process(_inputs, outputs, params) {
    const out = outputs[0][0]
    if (!out) return true
    const rpm = params.rpm.length ? params.rpm[0] : 0
    const thr = params.throttle.length ? params.throttle[0] : 0
    const sr = sampleRate
    const pulseHz = Math.max(0, (rpm / 60) * this.pulses)
    const dPhase = pulseHz / sr
    const D = this.pipeLen
    const nDelay = this.delay.length
    // Open throttle brightens the pipe. Closed throttle damps the resonance
    // so an overrun does not scream a fixed note down the straight.
    const cut = 0.08 + (0.22 + this.bright * 0.55) * thr
    const fb = (0.42 + 0.38 * thr) * (thr < 0.05 ? 0.35 : 1)
    for (let i = 0; i < out.length; i++) {
      this.phase += dPhase
      let excite = 0
      const span = this.pattern[this.step] || 1
      if (this.phase >= span) {
        this.phase -= span
        this.step = (this.step + 1) % this.pattern.length
        excite = (0.55 + 0.9 * thr) * (this.uneven && (this.step % 2 === 0) ? 0.72 : 1)
      }
      if (thr < 0.04 && rpm > 2800) {
        this.popCool -= 1
        if (this.popCool <= 0 && Math.random() < 0.9 / sr) {
          excite += 0.85
          this.popCool = sr * 0.85
        }
      }
      const j = (this.di - D + nDelay) % nDelay
      const delayed = this.delay[j]
      this.lp += cut * (delayed - this.lp)
      const y = excite * 0.85 + this.lp * fb
      this.delay[this.di] = y * 0.96
      this.di = (this.di + 1) % nDelay
      // A little mechanical edge on the V10, darker body on the six.
      this.tone += (0.12 + this.bright * 0.5) * (excite - this.tone)
      const mixed = y * (0.65 + 0.35 * thr) + this.tone * this.bright * 0.4
      const c = mixed * (0.28 + thr * 0.22)
      out[i] = c / (1 + Math.abs(c))
    }
    return true
  }
}

registerProcessor('crestline-engine', CrestlineEngine)
