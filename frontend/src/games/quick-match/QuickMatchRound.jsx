import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SYMBOLS, judgeResponse, makeAttempt, makeSequence, readRules } from './logic.js';

export default function QuickMatchRound({ level, onComplete }) {
  const rules = readRules(level);
  const [sequence] = useState(() => makeSequence(rules.trialCount, Date.now()));
  const [phase, setPhase] = useState('reference');
  const [trial, setTrial] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const responses = useRef([]);
  const startedAt = useRef(null);
  const trialStart = useRef(0);
  const locked = useRef(true);
  const complete = useRef(false);
  const respondRef = useRef(null);
  const stageRef = useRef(null);
  const errorCount = responses.current.filter((response) => !response.correct).length;

  function finish(aborted = false) {
    if (complete.current) return;
    complete.current = true;
    locked.current = true;
    onComplete(makeAttempt(level, responses.current, startedAt.current, aborted));
  }

  function respond(answer) {
    if (locked.current || complete.current) return;
    locked.current = true;
    const response = judgeResponse(
      sequence[trial],
      sequence[trial + 1],
      answer,
      performance.now() - trialStart.current,
      rules.timeLimit
    );
    responses.current.push(response);
    setFeedback(response);
    setPhase('feedback');
  }
  respondRef.current = respond;

  useLayoutEffect(() => {
    if (phase !== 'question') return;
    trialStart.current = performance.now();
    startedAt.current ??= new Date().toISOString();
    locked.current = false;
    const timer = window.setTimeout(() => respondRef.current(null), rules.timeLimit);
    return () => {
      locked.current = true;
      window.clearTimeout(timer);
    };
  }, [phase, trial, rules.timeLimit]);

  useEffect(() => {
    let timer;
    if (phase === 'reference') {
      timer = window.setTimeout(() => setPhase('gap'), 1200);
    } else if (phase === 'gap') {
      timer = window.setTimeout(() => setPhase('question'), 180);
    } else if (phase === 'feedback') {
      timer = window.setTimeout(() => {
        if (responses.current.length === rules.trialCount || errorCount > rules.maxErrors) {
          finish();
        } else {
          setTrial((value) => value + 1);
          setPhase('gap');
        }
      }, 220);
    }
    return () => window.clearTimeout(timer);
  }, [phase, errorCount]);

  useEffect(() => {
    stageRef.current?.focus();
    const onKey = (event) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      respondRef.current(event.key === 'ArrowRight');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function stopRound() {
    if (phase === 'question' && !locked.current) {
      locked.current = true;
      responses.current.push(
        judgeResponse(
          sequence[trial],
          sequence[trial + 1],
          null,
          performance.now() - trialStart.current,
          rules.timeLimit
        )
      );
    }
    startedAt.current ??= new Date().toISOString();
    finish(true);
  }

  const visible = phase !== 'gap';
  const symbolIndex = phase === 'reference' ? 0 : trial + 1;
  const symbol = SYMBOLS[sequence[symbolIndex]];

  return (
    <div className="qm-round" ref={stageRef} tabIndex={-1} aria-label="Quick Match game">
      <div className="qm-round-status">
        <span>
          Comparison {Math.min(trial + 1, rules.trialCount)} of {rules.trialCount}
        </span>
        <span>
          Errors {errorCount} / {rules.maxErrors}
        </span>
      </div>
      <progress
        className="qm-progress"
        value={responses.current.length}
        max={rules.trialCount}
        aria-label="Comparisons completed"
      />
      <div className="qm-stage">
        <p className="qm-prompt">
          {phase === 'reference' ? 'Remember this first symbol' : 'Same as the previous symbol?'}
        </p>
        <div
          className={`qm-symbol-card ${phase === 'feedback' ? (feedback.correct ? 'qm-correct' : 'qm-incorrect') : ''}`}
        >
          <span
            className="qm-symbol"
            style={{ visibility: visible ? 'visible' : 'hidden' }}
            role="img"
            aria-label={visible ? symbol.name : 'Next symbol'}
          >
            <span aria-hidden="true">{symbol.character}</span>
          </span>
        </div>
        <div className="qm-timer" key={`${trial}-${phase}`} aria-hidden="true">
          {phase === 'question' && <span style={{ animationDuration: `${rules.timeLimit}ms` }} />}
        </div>
        <p className="qm-feedback" role="status">
          {phase === 'feedback'
            ? feedback.timedOut
              ? 'Time ran out'
              : feedback.correct
                ? 'Correct'
                : 'Incorrect'
            : '\u00a0'}
        </p>
      </div>
      <div className="qm-controls">
        <button
          type="button"
          className="secondary"
          disabled={phase !== 'question'}
          onClick={() => respond(false)}
        >
          Different <kbd>←</kbd>
        </button>
        <button type="button" disabled={phase !== 'question'} onClick={() => respond(true)}>
          Same <kbd>→</kbd>
        </button>
      </div>
      <button type="button" className="ghost qm-end" onClick={stopRound}>
        End game
      </button>
    </div>
  );
}
