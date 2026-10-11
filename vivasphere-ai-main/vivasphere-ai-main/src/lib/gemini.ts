import { GoogleGenerativeAI } from '@google/generative-ai';
import { DifficultyLevel, QuestionType, QuestionMode, QuestionEvaluation, QuestionItem, RubricScore, OverallFeedback } from '@/types';

// Curated technical viva questions bank with both MCQ and Written bits
interface BankQuestion {
  type: QuestionType;
  question: string;
  focusArea: string;
  options?: string[];
  correctOptionIndex?: number;
  explanation?: string;
  keywords?: string[];
  ideal?: string;
}

const QUESTION_BANK: Record<string, Record<DifficultyLevel, BankQuestion[]>> = {
  'Operating Systems': {
    Beginner: [
      {
        type: 'MCQ',
        question: "Which CPU scheduling algorithm gives each process a fixed slice of time in a cyclic order, preventing starvation?",
        focusArea: "CPU Scheduling",
        options: [
          "First-Come First-Served (FCFS)",
          "Round Robin (RR)",
          "Shortest Job First (SJF)",
          "Priority Scheduling"
        ],
        correctOptionIndex: 1,
        explanation: "Round Robin uses a time quantum to cycle through ready processes, guaranteeing bounded wait times."
      },
      {
        type: 'WRITTEN',
        question: "Explain the fundamental difference between a Process and a Thread in modern operating systems. How do their memory spaces differ?",
        focusArea: "Process & Thread Architecture",
        keywords: ["process", "thread", "address space", "PCB", "stack", "registers", "shared memory", "overhead"],
        ideal: "A process is an isolated executing program instance with its own virtual address space (code, data, heap, stack) and PCB. A thread is a lightweight execution stream within a process sharing code, data, and heap, but retaining its own stack and registers."
      },
      {
        type: 'MCQ',
        question: "Which component of an operating system holds all vital information about a process (such as PID, state, PC, and registers)?",
        focusArea: "Process Management",
        options: [
          "Page Map Table (PMT)",
          "Process Control Block (PCB)",
          "Translation Lookaside Buffer (TLB)",
          "Interrupt Vector Table (IVT)"
        ],
        correctOptionIndex: 1,
        explanation: "The Process Control Block (PCB) contains all context, registers, PID, and scheduling state for a process."
      }
    ],
    Intermediate: [
      {
        type: 'MCQ',
        question: "In virtual memory systems, Belady's Anomaly occurs when increasing physical frames leads to more page faults. Which page replacement algorithm can exhibit this anomaly?",
        focusArea: "Virtual Memory",
        options: [
          "Least Recently Used (LRU)",
          "Optimal Page Replacement (OPT)",
          "First-In First-Out (FIFO)",
          "Counting-Based (LFU)"
        ],
        correctOptionIndex: 2,
        explanation: "FIFO is not a stack algorithm, so its set of frames for size N is not guaranteed to be a subset of N+1."
      },
      {
        type: 'WRITTEN',
        question: "What are the four Coffman conditions necessary for a Deadlock to occur? Explain how Resource Allocation Graphs help in deadlock detection.",
        focusArea: "Deadlock Theory & Coffman Conditions",
        keywords: ["mutual exclusion", "hold and wait", "no preemption", "circular wait", "cycle", "resource allocation graph"],
        ideal: "The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. In a Resource Allocation Graph, a cycle indicates deadlock in single-unit resource systems; in multi-unit systems, a knot/cycle is a necessary condition."
      },
      {
        type: 'MCQ',
        question: "Which of the following is an effective technique to prevent the Circular Wait condition in deadlock prevention?",
        focusArea: "Deadlock Prevention",
        options: [
          "Imposing a strict global linear ordering on all resource allocations",
          "Allowing threads to preempt CPU registers indefinitely",
          "Doubling the virtual page table sizes",
          "Using non-blocking spinlocks only"
        ],
        correctOptionIndex: 0,
        explanation: "By enforcing that resources must be requested in strictly increasing numerical order of their IDs, circular wait is mathematically prevented."
      }
    ],
    Expert: [
      {
        type: 'MCQ',
        question: "In multi-core SMP systems, what hardware protocol is most widely used to maintain cache consistency across CPU private L1/L2 caches?",
        focusArea: "Cache Coherence",
        options: [
          "MESI / MOESI Protocol",
          "Dijkstra Banker's Protocol",
          "Peterson's Algorithm",
          "Spanning Tree Protocol"
        ],
        correctOptionIndex: 0,
        explanation: "MESI (Modified, Exclusive, Shared, Invalid) and its variants maintain cache line states across multiple CPU cores via bus snooping."
      },
      {
        type: 'WRITTEN',
        question: "Explain the Readers-Writers problem with starvation prevention. How would you implement a starvation-free solution using semaphores?",
        focusArea: "Concurrency & Synchronization Primitives",
        keywords: ["readers-writers", "starvation", "semaphore", "mutex", "fair lock", "queue", "read count", "turnstile"],
        ideal: "In standard reader-preference, continuous readers starve writers. A starvation-free solution uses a turnstile semaphore or FIFO queue where an arriving writer blocks new incoming readers until pending writes execute."
      }
    ]
  },
  'Database Management Systems': {
    Beginner: [
      {
        type: 'MCQ',
        question: "Which ACID property guarantees that all operations within a transaction succeed completely or none are applied (all-or-nothing)?",
        focusArea: "ACID Properties",
        options: ["Consistency", "Atomicity", "Isolation", "Durability"],
        correctOptionIndex: 1,
        explanation: "Atomicity ensures that a multi-step transaction is treated as a single indivisible unit of work."
      },
      {
        type: 'WRITTEN',
        question: "Explain the ACID properties with a banking fund transfer example.",
        focusArea: "ACID & Transactions",
        keywords: ["atomicity", "consistency", "isolation", "durability", "commit", "rollback", "write-ahead log"],
        ideal: "Atomicity: debit and credit both occur or abort. Consistency: total balance remains preserved. Isolation: concurrent reads don't see half-transferred states. Durability: committed transfer persists across crashes via WAL."
      }
    ],
    Intermediate: [
      {
        type: 'MCQ',
        question: "Why do relational database engines preferentially use B+ Trees over standard B-Trees for primary index structures?",
        focusArea: "B+ Tree Indexing",
        options: [
          "B+ Trees store actual data records only at leaf nodes and link leaves in a doubly linked list for rapid range scans",
          "B+ Trees have an asymptotic search complexity of O(1) in the worst case",
          "B+ Trees require zero disk I/O operations",
          "B+ Trees do not require rebalancing during insertions"
        ],
        correctOptionIndex: 0,
        explanation: "In B+ Trees, internal nodes only hold routing keys, maximizing fan-out, while linked leaf nodes make sequential range scans efficient."
      },
      {
        type: 'WRITTEN',
        question: "What is Two-Phase Locking (2PL), and how does Strict 2PL prevent cascading aborts?",
        focusArea: "Concurrency Control",
        keywords: ["2PL", "growing phase", "shrinking phase", "strict 2PL", "exclusive lock", "cascading aborts", "conflict serializability"],
        ideal: "2PL guarantees conflict serializability by separating lock acquisition and release. Strict 2PL holds exclusive write locks until transaction commit or abort, preventing other transactions from reading dirty uncommitted data."
      }
    ],
    Expert: [
      {
        type: 'MCQ',
        question: "Under ANSI SQL transaction isolation levels, which anomaly can occur under 'Repeatable Read' that is prevented only under 'Serializable'?",
        focusArea: "Transaction Isolation",
        options: ["Dirty Read", "Non-repeatable Read", "Phantom Read", "Write Skew"],
        correctOptionIndex: 2,
        explanation: "A Phantom Read occurs when a range query executed twice in the same transaction sees newly inserted matching rows committed by another transaction."
      }
    ]
  },
  'Computer Networks': {
    Beginner: [
      {
        type: 'MCQ',
        question: "Which transport protocol is connection-oriented, guarantees in-order packet delivery, and implements flow control?",
        focusArea: "Transport Layer",
        options: ["UDP", "IP", "TCP", "ICMP"],
        correctOptionIndex: 2,
        explanation: "TCP provides reliable, sequenced byte-stream delivery with congestion and flow control."
      },
      {
        type: 'WRITTEN',
        question: "Walk through the TCP 3-Way Handshake step-by-step. What flags and sequence numbers are exchanged?",
        focusArea: "TCP Handshake",
        keywords: ["SYN", "SYN-ACK", "ACK", "sequence number", "ISN", "acknowledgement"],
        ideal: "Client sends SYN (seq=x). Server replies with SYN-ACK (seq=y, ack=x+1). Client concludes with ACK (seq=x+1, ack=y+1)."
      }
    ],
    Intermediate: [
      {
        type: 'MCQ',
        question: "In TCP congestion control, what triggers the 'Fast Retransmit' mechanism without waiting for the retransmission timeout timer to expire?",
        focusArea: "Congestion Control",
        options: [
          "Arrival of 3 duplicate ACKs for the same packet sequence",
          "A DNS query response delay exceeding 50ms",
          "A FIN packet received from the remote gateway",
          "An ICMP Destination Unreachable packet"
        ],
        correctOptionIndex: 0,
        explanation: "3 duplicate ACKs indicate to the sender that subsequent packets arrived, so one specific segment was lost and should be immediately resent."
      },
      {
        type: 'WRITTEN',
        question: "Explain TCP Slow Start and Congestion Avoidance (AIMD).",
        focusArea: "TCP Congestion Control",
        keywords: ["slow start", "congestion avoidance", "cwnd", "ssthresh", "AIMD", "exponential", "linear"],
        ideal: "Slow start doubles cwnd exponentially each RTT until ssthresh is hit. Congestion Avoidance then increases cwnd linearly (additive increase) and cuts cwnd upon loss (multiplicative decrease)."
      }
    ],
    Expert: [
      {
        type: 'MCQ',
        question: "Which attribute in BGP (Border Gateway Protocol) is primarily examined by routers to detect and prevent routing loops between Autonomous Systems?",
        focusArea: "BGP Routing",
        options: ["TTL (Time to Live)", "AS-Path", "Checksum", "Subnet Mask"],
        correctOptionIndex: 1,
        explanation: "If a BGP router observes its own Autonomous System Number in the AS-Path attribute of an advertisement, it drops the route to prevent a loop."
      }
    ]
  },
  'Data Structures & Algorithms': {
    Beginner: [
      {
        type: 'MCQ',
        question: "What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST) with N nodes?",
        focusArea: "Trees & Search",
        options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
        correctOptionIndex: 2,
        explanation: "If elements are inserted in sorted order, the BST degenerates into a linked list with O(N) search depth."
      },
      {
        type: 'WRITTEN',
        question: "Compare the time complexity and memory overhead of an Array vs a Singly Linked List.",
        focusArea: "Linear Data Structures",
        keywords: ["array", "linked list", "O(1)", "O(n)", "cache locality", "contiguous memory", "pointer"],
        ideal: "Array provides O(1) random index access and optimal CPU cache locality. Linked lists allow O(1) head insertion but require pointer overhead per node and lack cache locality."
      }
    ],
    Intermediate: [
      {
        type: 'MCQ',
        question: "Which sorting algorithm is guaranteed to run in O(N log N) time in the worst case while operating in-place with O(1) auxiliary memory?",
        focusArea: "Sorting Algorithms",
        options: ["Merge Sort", "QuickSort", "HeapSort", "Bubble Sort"],
        correctOptionIndex: 2,
        explanation: "HeapSort achieves worst-case O(N log N) using an in-place max-heap with O(1) auxiliary space."
      },
      {
        type: 'WRITTEN',
        question: "Explain the QuickSort partitioning algorithm and why randomized pivot selection prevents the O(N^2) worst case.",
        focusArea: "Divide and Conquer",
        keywords: ["quicksort", "partition", "pivot", "worst case", "O(n^2)", "randomized"],
        ideal: "QuickSort partitions around a pivot. Degrades to O(N^2) on sorted inputs with naive first/last pivot. Randomized pivot breaks adversarial patterns, guaranteeing expected O(N log N)."
      }
    ],
    Expert: [
      {
        type: 'MCQ',
        question: "What heuristic property must be satisfied by h(n) in the A* search algorithm to guarantee an optimal path on graph searches without reopening visited nodes?",
        focusArea: "Graph Heuristic Search",
        options: ["Consistency (Monotonicity)", "Admissibility only", "Over-estimation by at most 10%", "Linear proportionality"],
        correctOptionIndex: 0,
        explanation: "A consistent (monotonic) heuristic satisfies the triangle inequality h(a) <= c(a,b) + h(b), guaranteeing optimality without revisiting nodes."
      }
    ]
  }
};

export class VivaAIEngine {
  private static geminiKey = process.env.GEMINI_API_KEY || '';

  // ── Extract key concepts from free-form syllabus / topic text ──
  private static extractConcepts(topic: string, syllabusText: string): string[] {
    const combined = `${topic} ${syllabusText}`.toLowerCase();

    // Common technical concept patterns
    const patterns = [
      /\b([a-z][a-z\s\-]{3,30}(?:algorithm|protocol|theorem|model|pattern|structure|network|system|tree|graph|sort|search|hash|queue|stack|heap|array|list|matrix|vector|layer|module|class|object|function|method|variable|loop|recursion|complexity|proof|logic|gate|circuit|memory|cache|register|pipeline|interrupt|process|thread|lock|mutex|semaphore|deadlock|race|condition|invariant|abstraction|polymorphism|inheritance|encapsulation|interface|design|architecture|framework|library|api|database|query|index|join|transaction|normalization|key|constraint|schema|relation|tuple|attribute|entity|view|trigger|procedure|function|aggregate|group|cluster|classification|regression|neural|layer|epoch|gradient|loss|activation|backpropagation|feature|label|dataset|train|test|validation|overfitting|underfitting|bias|variance|ensemble|boosting|bagging|random|forest|support|vector|machine|kernel|decision|naive|bayes|markov|chain|monte|carlo|dynamic|programming|greedy|divide|conquer|branch|bound|backtrack|flow|cut|matching|coloring|spanning|shortest|path|cycle|topological|strongly|connected|bipartite|planar|network|flow|max|min|cut|theorem))/gi,
    ];

    const found = new Set<string>();

    // Extract from patterns
    for (const pat of patterns) {
      const hits = combined.match(pat) || [];
      hits.forEach(h => found.add(h.trim()));
    }

    // Also extract capitalised multi-word phrases from the original text (likely topic names)
    const capPhrases = (topic + ' ' + syllabusText).match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3}\b/g) || [];
    capPhrases.forEach(p => { if (p.length > 3) found.add(p.trim()); });

    // Extract plain words unique to topic
    topic.split(/[\s,;:\/\-\(\)]+/).forEach(w => {
      if (w.length > 3) found.add(w.trim());
    });

    // Extract unit headers or bullet points
    const unitMatches = syllabusText.match(/(?:unit|module|chapter|topic|section)\s*\d*[\s:\-]*([^\n\.]{4,60})/gi) || [];
    unitMatches.forEach(u => {
      const clean = u.replace(/^(?:unit|module|chapter|topic|section)\s*\d*[\s:\-]*/i, '').trim();
      if (clean.length > 3) found.add(clean);
    });

    const arr = Array.from(found).filter(c => c.length > 2 && c.length < 60);
    return arr.slice(0, 20); // top 20 concepts
  }

  // ── Build questions from a custom topic + syllabus ──
  private static generateCustomTopicQuestions(
    topic: string,
    difficulty: DifficultyLevel,
    count: number,
    questionMode: QuestionMode,
    syllabusText: string
  ): QuestionItem[] {
    const concepts = this.extractConcepts(topic, syllabusText);
    const questions: QuestionItem[] = [];
    let idCounter = 1;

    // Extract key sentences / statements from source material
    const rawSentences = syllabusText
      .split(/[.\n;•]+/)
      .map(s => s.trim())
      .filter(s => s.length > 25 && s.length < 200 && !s.toLowerCase().startsWith('http'));

    // Helper: pick a concept safely
    const concept = (i: number) => concepts[i % Math.max(concepts.length, 1)] || topic;
    const sentence = (i: number) => rawSentences[i % Math.max(rawSentences.length, 1)] || '';

    // Template banks for custom topics
    const mcqTemplates: Array<(c: string, t: string, s: string) => Omit<BankQuestion, 'type'>> = [
      (c, t, s) => ({
        question: s
          ? `Based on the source material: "${s.substring(0, 110)}...", what is the core engineering role of "${c}"?`
          : `Which of the following best describes the core purpose of "${c}" in the context of ${t}?`,
        focusArea: c,
        options: [
          `It defines the operational invariants, state boundaries, and execution model of ${c}`,
          `It is an optional diagnostic logging tool with no impact on runtime performance`,
          `It completely supersedes and eliminates the need for any other components in ${t}`,
          `It is strictly limited to bare-metal firmware and cannot run in user-space`
        ],
        correctOptionIndex: 0,
        explanation: `As detailed in the syllabus for ${t}, "${c}" establishes crucial operational invariants and structural execution bounds.`
      }),
      (c, t, s) => ({
        question: `In ${t}, what is the primary technical advantage of utilizing "${c}" over conventional alternatives?`,
        focusArea: c,
        options: [
          `Better time/space complexity, deterministic latency, and predictable scaling`,
          `It mathematically guarantees zero CPU or memory consumption at all times`,
          `It eliminates the need for error-handling and failure detection`,
          `It is solely an academic model with no real-world engineering utility`
        ],
        correctOptionIndex: 0,
        explanation: `"${c}" in ${t} is selected because it delivers superior asymptotic complexity, efficiency, and robust scalability.`
      }),
      (c, t, s) => ({
        question: `Which of the following statements regarding "${c}" in ${t} is technically ACCURATE?`,
        focusArea: c,
        options: [
          `It enforces strict preconditions and postconditions ensuring safe state transitions`,
          `It completely fails under multi-threaded, asynchronous, or concurrent workloads`,
          `It was officially removed and deprecated in modern specifications of ${t}`,
          `It can only process static linear arrays and strictly rejects non-linear structures`
        ],
        correctOptionIndex: 0,
        explanation: `"${c}" operates under well-defined state invariants and preconditions that guarantee system correctness.`
      }),
      (c, t, s) => ({
        question: s
          ? `Considering the concept: "${s.substring(0, 100)}...", how is "${c}" distinguished in modern ${t} architectures?`
          : `What distinguishes "${c}" from other foundational paradigms in ${t}?`,
        focusArea: c,
        options: [
          `Its specialized algorithmic complexity, partition tolerance, and invariant guarantees`,
          `It is identical in every aspect to standard brute-force implementations`,
          `It only differs in syntax and naming convention with identical performance`,
          `It is designed purely as an experimental protocol that cannot handle edge cases`
        ],
        correctOptionIndex: 0,
        explanation: `"${c}" is distinguished by its unique algorithmic invariants, efficiency properties, and structural guarantees.`
      }),
    ];

    const writtenTemplates: Array<(c: string, t: string, s: string) => Omit<BankQuestion, 'type'>> = [
      (c, t, s) => ({
        question: s
          ? `Based on the source material excerpt: "${s.substring(0, 110)}...", provide a thorough technical breakdown of "${c}". Explain its internal mechanism and primary engineering use case in ${t}.`
          : `Explain the concept of "${c}" as it applies to ${t}. Include its formal definition, working mechanism, and real-world system application.`,
        focusArea: c,
        keywords: [c.toLowerCase().split(' ')[0], t.toLowerCase().split(' ')[0], 'mechanism', 'invariants', 'complexity', 'tradeoffs', 'state', 'architecture'],
        ideal: `A comprehensive answer defines "${c}" accurately, breaks down its step-by-step operational flow, articulates concrete performance trade-offs, and illustrates a real-world scenario within ${t}.`
      }),
      (c, t, s) => ({
        question: `Compare and contrast "${c}" with alternative design approaches in ${t}. Under what workload or resource constraints would you recommend one over the other?`,
        focusArea: c,
        keywords: [c.toLowerCase().split(' ')[0], 'tradeoff', 'latency', 'throughput', 'scalability', 'complexity', 'workload', 'bottleneck'],
        ideal: `A strong candidate evaluates "${c}" across dimensions such as time/space complexity, resource utilization, failure recovery, and real-world implementation cost.`
      }),
      (c, t, s) => ({
        question: `Analyze the failure modes of "${c}" in ${t}. What catastrophic edge cases, race conditions, or memory/network anomalies could arise, and how would you mitigate them?`,
        focusArea: c,
        keywords: [c.toLowerCase().split(' ')[0], 'failure', 'edge case', 'race condition', 'mitigation', 'recovery', 'invariant', 'timeout', 'deadlock'],
        ideal: `An expert response outlines critical failure modes for "${c}", pinpoints root causes (such as split-brain, starvation, or resource exhaustion), and specifies robust prevention techniques.`
      }),
      (c, t, s) => ({
        question: `Walk through the algorithmic execution lifecycle of "${c}" in ${t}. What mathematical or structural invariants must be preserved at each state transition?`,
        focusArea: c,
        keywords: [c.toLowerCase().split(' ')[0], 'lifecycle', 'transition', 'invariant', 'state', 'iteration', 'convergence', 'termination'],
        ideal: `A top-scoring answer details the initial state, transition steps, termination conditions, and the exact invariants preserved throughout the execution of "${c}".`
      }),
    ];

    let mcqIdx = 0, writIdx = 0, templateIdx = 0;

    while (questions.length < count) {
      const needMCQ = questionMode === 'MCQ_ONLY' ||
        (questionMode === 'MIXED' && questions.length % 2 === 0);

      if (needMCQ) {
        const c = concept(mcqIdx);
        const s = sentence(mcqIdx);
        const tmpl = mcqTemplates[templateIdx % mcqTemplates.length](c, topic, s);
        questions.push({
          id: idCounter++,
          type: 'MCQ',
          question: tmpl.question!,
          difficulty,
          topic,
          focusArea: tmpl.focusArea!,
          options: tmpl.options!,
          correctOptionIndex: tmpl.correctOptionIndex!,
          explanation: tmpl.explanation!
        });
        mcqIdx++;
      } else {
        const c = concept(writIdx);
        const s = sentence(writIdx);
        const tmpl = writtenTemplates[templateIdx % writtenTemplates.length](c, topic, s);
        questions.push({
          id: idCounter++,
          type: 'WRITTEN',
          question: tmpl.question!,
          difficulty,
          topic,
          focusArea: tmpl.focusArea!,
          options: [],
          explanation: tmpl.ideal!
        });
        writIdx++;
      }
      templateIdx++;
    }

    return questions.slice(0, count);
  }

  // Generate hybrid questions (MCQs + Written bits)
  static async generateQuestions(
    topic: string,
    initialDifficulty: DifficultyLevel,
    count: number,
    questionMode: QuestionMode = 'MIXED',
    syllabusExcerpt?: string
  ): Promise<QuestionItem[]> {
    const hasCustomMaterial = Boolean(syllabusExcerpt && syllabusExcerpt.trim().length > 25);

    // Curated bank matching
    const matchedCategory = Object.keys(QUESTION_BANK).find(k =>
      k.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(k.toLowerCase())
    );

    // ── Custom topic OR custom material provided: generate tailored questions directly from source ──
    if (!matchedCategory || hasCustomMaterial) {
      // If Gemini API Key is configured, attempt real-time generative synthesis
      if (this.geminiKey) {
        try {
          const ai = new GoogleGenerativeAI(this.geminiKey);
          const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const prompt = `You are a strict Computer Science engineering university professor conducting an oral viva voce examination.
Generate ${count} rigorous exam questions based on the following custom topic and reference content:
Topic: "${topic}"
Difficulty Level: ${initialDifficulty}
Question Mode: ${questionMode} (MCQ_ONLY = only 4-option MCQs; WRITTEN_ONLY = only written/oral open questions with empty options []; MIXED = alternating MCQ and WRITTEN).

Reference Content:
"""
${syllabusExcerpt ? syllabusExcerpt.substring(0, 3000) : topic}
"""

Return ONLY a valid JSON array of ${count} objects with this exact structure:
[
  {
    "id": 1,
    "type": "MCQ",
    "question": "Clear technical question referencing specific concepts from the content...",
    "difficulty": "${initialDifficulty}",
    "topic": "${topic}",
    "focusArea": "Specific Concept",
    "options": ["Correct Option", "Realistic Distractor 1", "Realistic Distractor 2", "Realistic Distractor 3"],
    "correctOptionIndex": 0,
    "explanation": "Authoritative explanation citing the reason..."
  },
  {
    "id": 2,
    "type": "WRITTEN",
    "question": "In-depth analytical question testing mechanism and tradeoffs...",
    "difficulty": "${initialDifficulty}",
    "topic": "${topic}",
    "focusArea": "Specific Concept",
    "options": [],
    "explanation": "Ideal answer criteria and expected keywords..."
  }
]`;
          const result = await Promise.race([
            model.generateContent(prompt),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('AI generation timed out')), 4500))
          ]);
          const responseText = result.response.text().trim();
          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.slice(0, count).map((q: any, i: number) => ({
                id: i + 1,
                type: q.type === 'WRITTEN' ? 'WRITTEN' : 'MCQ',
                question: q.question,
                difficulty: initialDifficulty,
                topic,
                focusArea: q.focusArea || topic,
                options: q.type === 'WRITTEN' ? [] : (q.options || ['Option A', 'Option B', 'Option C', 'Option D']),
                correctOptionIndex: q.type === 'MCQ' ? (Number(q.correctOptionIndex) || 0) : undefined,
                explanation: q.explanation || ''
              }));
            }
          }
        } catch (err) {
          console.warn('Gemini generative fallback triggered:', err);
        }
      }

      return this.generateCustomTopicQuestions(topic, initialDifficulty, count, questionMode, syllabusExcerpt || '');
    }

    const pool = QUESTION_BANK[matchedCategory];
    const questions: QuestionItem[] = [];
    let idCounter = 1;

    // Collect candidates from difficulty tiers
    const diffOrder: DifficultyLevel[] = [initialDifficulty, 'Intermediate', 'Expert', 'Beginner'];
    const candidates: BankQuestion[] = [];

    for (const diff of diffOrder) {
      const items = pool[diff] || [];
      for (const item of items) {
        if (!candidates.some(c => c.question === item.question)) {
          candidates.push({ ...item });
        }
      }
    }

    // Filter by questionMode
    let filtered = candidates;
    if (questionMode === 'MCQ_ONLY') {
      filtered = candidates.filter(c => c.type === 'MCQ');
    } else if (questionMode === 'WRITTEN_ONLY') {
      filtered = candidates.filter(c => c.type === 'WRITTEN');
    }

    // If MIXED, alternate MCQ and WRITTEN
    if (questionMode === 'MIXED') {
      const mcqs = candidates.filter(c => c.type === 'MCQ');
      const written = candidates.filter(c => c.type === 'WRITTEN');
      let mIdx = 0, wIdx = 0;

      while (questions.length < count && (mIdx < mcqs.length || wIdx < written.length)) {
        if (mIdx < mcqs.length && questions.length < count) {
          const q = mcqs[mIdx++];
          questions.push({
            id: idCounter++,
            type: 'MCQ',
            question: q.question,
            difficulty: initialDifficulty,
            topic: matchedCategory,
            focusArea: q.focusArea,
            options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correctOptionIndex: q.correctOptionIndex ?? 0,
            explanation: q.explanation
          });
        }
        if (wIdx < written.length && questions.length < count) {
          const q = written[wIdx++];
          questions.push({
            id: idCounter++,
            type: 'WRITTEN',
            question: q.question,
            difficulty: initialDifficulty,
            topic: matchedCategory,
            focusArea: q.focusArea,
            options: [],
            explanation: q.ideal
          });
        }
      }
    } else {
      for (const q of filtered) {
        if (questions.length < count) {
          questions.push({
            id: idCounter++,
            type: q.type,
            question: q.question,
            difficulty: initialDifficulty,
            topic: matchedCategory,
            focusArea: q.focusArea,
            options: q.options || [],
            correctOptionIndex: q.correctOptionIndex,
            explanation: q.explanation || q.ideal
          });
        }
      }
    }

    // If count still not reached, fill with generated bits
    while (questions.length < count) {
      const isMcq = questionMode === 'MCQ_ONLY' || (questionMode === 'MIXED' && questions.length % 2 === 0);
      if (isMcq) {
        questions.push({
          id: idCounter++,
          type: 'MCQ',
          question: `In ${topic}, which of the following best characterizes high-throughput concurrency models?`,
          difficulty: 'Intermediate',
          topic,
          focusArea: 'Concurrency',
          options: [
            "Lock-free data structures using atomic Compare-And-Swap (CAS)",
            "Coarse-grained global interpreter lock",
            "Single-threaded polling loop",
            "Synchronous blocking disk writes"
          ],
          correctOptionIndex: 0,
          explanation: "Lock-free CAS algorithms enable concurrent updates without thread suspension overhead."
        });
      } else {
        questions.push({
          id: idCounter++,
          type: 'WRITTEN',
          question: `In ${topic}, explain how cache coherence or state consistency is maintained across distributed nodes.`,
          difficulty: 'Expert',
          topic,
          focusArea: 'Distributed Systems & State',
          options: [],
          explanation: 'Requires consensus protocols or cache coherence snooping.'
        });
      }
    }

    return questions.slice(0, count);
  }

  // Evaluate candidate's answer (MCQ option or Written text)
  static async evaluateAnswer(
    topic: string,
    questionItem: QuestionItem,
    userAnswer: string,
    selectedOptionIndex?: number
  ): Promise<QuestionEvaluation> {
    const qIndex = questionItem.id;
    const diff = questionItem.difficulty;

    // 1. MCQ Evaluation (Exact key match)
    if (questionItem.type === 'MCQ') {
      const correctIdx = questionItem.correctOptionIndex ?? 0;
      const isCorrect = selectedOptionIndex === correctIdx;
      const score = isCorrect ? 100 : 0;
      const correctOptionText = questionItem.options?.[correctIdx] || '';
      const chosenOptionText = selectedOptionIndex !== undefined ? questionItem.options?.[selectedOptionIndex] || userAnswer : userAnswer;

      let nextDiff: DifficultyLevel = diff;
      let reason = 'Maintaining current difficulty baseline.';

      if (isCorrect) {
        if (diff === 'Beginner') { nextDiff = 'Intermediate'; reason = 'Correct MCQ response; escalating to Intermediate tier.'; }
        else if (diff === 'Intermediate') { nextDiff = 'Expert'; reason = 'Correct MCQ response; elevating to Expert tier.'; }
        else { nextDiff = 'Expert'; reason = 'Demonstrated mastery on Expert question.'; }
      } else {
        if (diff === 'Expert') { nextDiff = 'Intermediate'; reason = 'Incorrect MCQ response; stepping down to Intermediate.'; }
        else if (diff === 'Intermediate') { nextDiff = 'Beginner'; reason = 'Incorrect MCQ response; testing foundational concepts.'; }
      }

      return {
        questionIndex: qIndex,
        type: 'MCQ',
        question: questionItem.question,
        difficulty: diff,
        userAnswer: chosenOptionText,
        selectedOptionIndex,
        correctOptionIndex: correctIdx,
        isCorrect,
        score,
        accuracyScore: score,
        depthScore: isCorrect ? 100 : 20,
        clarityScore: 100,
        feedback: isCorrect 
          ? `✓ CORRECT: Excellent choice! ${questionItem.explanation || ''}`
          : `✗ INCORRECT: You selected "${chosenOptionText}". The correct answer is "${correctOptionText}". ${questionItem.explanation || ''}`,
        idealAnswer: correctOptionText,
        keyStrengths: isCorrect ? ['Precise conceptual recognition', 'Fast option evaluation'] : [],
        keyMissingConcepts: isCorrect ? [] : [correctOptionText],
        nextDifficulty: nextDiff,
        difficultyChangeReason: reason
      };
    }

    // 2. Written Viva Voce Evaluation (AI / Heuristic)
    return this.evaluateWrittenAnswer(topic, questionItem, userAnswer);
  }

  private static evaluateWrittenAnswer(
    topic: string,
    questionItem: QuestionItem,
    userAnswer: string
  ): QuestionEvaluation {
    const trimmed = userAnswer.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const diff = questionItem.difficulty;

    // Start with keywords derived from the question itself + focusArea + topic
    const derivedKeywords = [
      ...questionItem.focusArea.toLowerCase().split(/[\s,;:\-\/]+/).filter(w => w.length > 3),
      ...topic.toLowerCase().split(/[\s,;:\-\/]+/).filter(w => w.length > 3),
      'definition', 'mechanism', 'example', 'tradeoff', 'complexity', 'application', 'invariant'
    ];

    let matchedKeywords: string[] = Array.from(new Set(derivedKeywords)).slice(0, 10);
    let ideal = questionItem.explanation || "A complete answer accurately addresses the concept definition, working mechanism, and complexity tradeoffs with a concrete example.";

    // Try to override with bank keywords if this question is in the curated bank
    for (const cat of Object.values(QUESTION_BANK)) {
      for (const d of Object.values(cat)) {
        for (const item of d) {
          if (item.question.toLowerCase().includes(questionItem.question.toLowerCase().substring(0, 20))) {
            if (item.keywords) matchedKeywords = item.keywords;
            if (item.ideal) ideal = item.ideal;
            break;
          }
        }
      }
    }

    const lowerAns = trimmed.toLowerCase();
    const foundKeywords = matchedKeywords.filter(k => lowerAns.includes(k.toLowerCase()));
    const keywordRatio = matchedKeywords.length > 0 ? (foundKeywords.length / matchedKeywords.length) : 0.5;

    let baseScore = 30;
    if (wordCount >= 15) baseScore += 20;
    if (wordCount >= 40) baseScore += 15;
    if (wordCount >= 80) baseScore += 10;
    baseScore += Math.round(keywordRatio * 35);
    baseScore = Math.min(100, Math.max(15, baseScore));

    const isCorrect = baseScore >= 60;

    let nextDiff: DifficultyLevel = diff;
    let reason = "Maintaining current difficulty level to test conceptual stability.";

    if (baseScore >= 80) {
      if (diff === 'Beginner') { nextDiff = 'Intermediate'; reason = 'Solid foundational grasp; escalating to Intermediate.'; }
      else if (diff === 'Intermediate') { nextDiff = 'Expert'; reason = 'Strong architectural precision; elevating to Expert tier.'; }
    } else if (baseScore < 50) {
      if (diff === 'Expert') { nextDiff = 'Intermediate'; reason = 'Candidate missed edge scenarios; stepping down to Intermediate.'; }
      else if (diff === 'Intermediate') { nextDiff = 'Beginner'; reason = 'Candidate missed core definitions; shifting to foundations.'; }
    }

    const keyMissing = matchedKeywords
      .filter(k => !foundKeywords.includes(k))
      .slice(0, 3);

    return {
      questionIndex: questionItem.id,
      type: 'WRITTEN',
      question: questionItem.question,
      difficulty: diff,
      userAnswer,
      isCorrect,
      score: baseScore,
      accuracyScore: Math.min(100, Math.round(baseScore * 1.05)),
      depthScore: Math.max(20, Math.round(baseScore * 0.95)),
      clarityScore: Math.min(100, Math.max(30, wordCount > 25 ? 85 : 55)),
      feedback: isCorrect
        ? `✓ ACCREDITED DEFENSE (${baseScore}%): You highlighted ${foundKeywords.slice(0, 2).join(' and ') || 'the main concept'} effectively.`
        : `✗ DEFICIENT EXPLANATION (${baseScore}%): Your response lacks technical precision regarding ${keyMissing.slice(0, 2).join(' and ') || 'underlying system mechanics'}.`,
      idealAnswer: ideal,
      keyStrengths: foundKeywords.length > 0 ? foundKeywords.slice(0, 3) : ['Direct response format'],
      keyMissingConcepts: keyMissing.length > 0 ? keyMissing : ['Rigorous algorithmic complexity analysis'],
      nextDifficulty: nextDiff,
      difficultyChangeReason: reason
    };
  }

  // Generate overall feedback with correct/wrong count
  static generateOverallFeedback(
    topic: string,
    evaluations: QuestionEvaluation[],
    integrityScore: number,
    isTerminatedViolation: boolean
  ): {
    finalScore: number;
    correctCount: number;
    incorrectCount: number;
    rubricScores: RubricScore;
    overallFeedback: OverallFeedback;
  } {
    const correctCount = evaluations.filter(e => e.isCorrect).length;
    const incorrectCount = evaluations.length - correctCount;

    if (evaluations.length === 0) {
      return {
        finalScore: 0,
        correctCount: 0,
        incorrectCount: 0,
        rubricScores: { conceptualClarity: 0, technicalDepth: 0, terminologyAccuracy: 0, practicalApplication: 0 },
        overallFeedback: {
          grade: 'F',
          gradeDescription: 'Session terminated before any question could be evaluated.',
          percentile: 5,
          summary: 'The session was aborted with 0 answers recorded.',
          coreStrengths: [],
          knowledgeGaps: ['Exam completion'],
          actionableNextSteps: ['Re-attempt in a proctored setting.']
        }
      };
    }

    const avgScore = evaluations.reduce((acc, curr) => acc + curr.score, 0) / evaluations.length;
    const avgAccuracy = evaluations.reduce((acc, curr) => acc + curr.accuracyScore, 0) / evaluations.length;
    const avgDepth = evaluations.reduce((acc, curr) => acc + curr.depthScore, 0) / evaluations.length;
    const avgClarity = evaluations.reduce((acc, curr) => acc + curr.clarityScore, 0) / evaluations.length;

    const penaltyRatio = integrityScore / 100;
    const adjustedFinalScore = isTerminatedViolation
      ? Math.round(avgScore * 0.5 * penaltyRatio)
      : Math.round(avgScore * penaltyRatio);

    const rubricScores: RubricScore = {
      conceptualClarity: Math.round(avgClarity * (isTerminatedViolation ? 0.6 : 1)),
      technicalDepth: Math.round(avgDepth * (isTerminatedViolation ? 0.6 : 1)),
      terminologyAccuracy: Math.round(avgAccuracy * (isTerminatedViolation ? 0.6 : 1)),
      practicalApplication: Math.round(avgScore * (isTerminatedViolation ? 0.6 : 1))
    };

    let grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    let gradeDesc = 'Unsatisfactory';

    if (isTerminatedViolation) {
      grade = 'F';
      gradeDesc = 'Disqualified (Academic Integrity Violation)';
    } else if (adjustedFinalScore >= 90) {
      grade = 'S';
      gradeDesc = 'Outstanding Technical Mastery (Exemplary)';
    } else if (adjustedFinalScore >= 80) {
      grade = 'A';
      gradeDesc = 'Excellent Technical Competence';
    } else if (adjustedFinalScore >= 70) {
      grade = 'B';
      gradeDesc = 'Good Conceptual Understanding';
    } else if (adjustedFinalScore >= 55) {
      grade = 'C';
      gradeDesc = 'Satisfactory / Passing Grade';
    } else if (adjustedFinalScore >= 40) {
      grade = 'D';
      gradeDesc = 'Needs Remediation';
    } else {
      grade = 'F';
      gradeDesc = 'Did Not Meet Minimum Standards';
    }

    let percentile = Math.min(99, Math.max(10, Math.round(adjustedFinalScore * 0.95 + 4)));
    if (isTerminatedViolation) percentile = 8;

    const allStrengths = Array.from(new Set(evaluations.flatMap(e => e.keyStrengths))).slice(0, 4);
    const allGaps = Array.from(new Set(evaluations.flatMap(e => e.keyMissingConcepts))).slice(0, 4);

    return {
      finalScore: adjustedFinalScore,
      correctCount,
      incorrectCount,
      rubricScores,
      overallFeedback: {
        grade,
        gradeDescription: gradeDesc,
        percentile,
        summary: isTerminatedViolation
          ? `Session was terminated due to anti-cheat violation. Candidate got ${correctCount} of ${evaluations.length} questions correct prior to disqualification.`
          : `Candidate completed ${evaluations.length} questions in ${topic} (${correctCount} Correct, ${incorrectCount} Incorrect). Achieved an overall composite score of ${adjustedFinalScore}/100.`,
        coreStrengths: allStrengths.length > 0 ? allStrengths : ['Fast MCQ evaluation', 'Direct responses'],
        knowledgeGaps: allGaps.length > 0 ? allGaps : ['Detailed hardware/software boundary tradeoffs'],
        actionableNextSteps: [
          `Review textbook chapters covering the ${incorrectCount} missed questions.`,
          'Practice explaining complex algorithmic invariants verbally in 60 seconds.',
          'Solve practical implementations to solidify theoretical concepts.'
        ]
      }
    };
  }
}
