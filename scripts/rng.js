export class RNG {
  m_w = 123456789;
  m_z = 987654321;
  mask = 0xffffffff;

  // Takes any integer
  constructor(seed) {
    this.m_w = (123456789 + seed) & this.mask;
    this.m_z = (987654321 - seed) & this.mask;
  }

  // Returns number between 0 (inclusive) and 1.0 (exclusive),
  // just like Math.random().
  random() {
    this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
    this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
    var result = ((this.m_z << 16) + (this.m_w & 65535)) >>> 0;
    result /= 4294967296;
    return result;
  }
}

/*
implemention found here: https://stackoverflow.com/a/19301306/2258875

var m_w = 123456789;
var m_z = 987654321;
var mask = 0xffffffff;

// Takes any integer
function seed(i) {
    m_w = (123456789 + i) & mask;
    m_z = (987654321 - i) & mask;
}

// Returns number between 0 (inclusive) and 1.0 (exclusive),
// just like Math.random().
function random()
{
    m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
    m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
    var result = ((m_z << 16) + (m_w & 65535)) >>> 0;
    result /= 4294967296;
    return result;
}
*/
