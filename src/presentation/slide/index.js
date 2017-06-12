/** @jsx h */
import { h } from '../../utils/dom.js';
import { animWatcher } from '../../utils/anims';
import css from './style.scss';

document.head.append(<style>{css}</style>);

function rafPromise() {
  return new Promise(r => requestAnimationFrame(r));
}

export default class Slide extends HTMLElement {
  constructor() {
    super();
    this._func = null;
    this._nextResolve = null;
    this._complete = false;
    this._synchronizePromises = [];
    this._currentStateNum = 0;
    this._autoAdvanceNum = 0;
    this.transition = true;

    // Enables auto-animating elements with particular attributes
    animWatcher(this);
  }

  async _run(func, {
    preventTransition = false,
    autoAdvanceNum = 0
  }={}) {
    this.transition = !preventTransition;
    this._autoAdvanceNum = autoAdvanceNum;
    
    const slideDone = func(this);
    
    await slideDone;
    this._complete = true;
  }
  
  _advance({
    preventTransition = false
  }={}) {
    this.transition = !preventTransition;
    if (this._nextResolve) this._nextResolve();
  }

  next() {
    if (this._nextResolve) throw Error('next() called before previous next had resolved – ensure you await slide.next()');

    return new Promise(resolve => {
      this._nextResolve = resolve;
      if (this._autoAdvanceNum) {
        this._autoAdvanceNum--;
        resolve();
      }
    }).then(() => {
      this._currentStateNum++;
      this._nextResolve = null;
      this._synchronizePromises = [Promise.all(this._synchronizePromises)];
    });
  }

  async synchronize(promise = undefined) {
    const synchronizePromises = this._synchronizePromises;
    
    if (promise) {
      const caughtPromise = promise.catch(err => {
        // Don't rethrow the error, just log
        console.error('synchronize promise rejected', err);
      }); 
      
      synchronizePromises.push(caughtPromise);
    }

    await rafPromise();

    return Promise.all(synchronizePromises);
  }

  currentSynchronized() {
    return Promise.all(this._synchronizePromises);
  }
}

customElements.define('preso-slide', Slide);