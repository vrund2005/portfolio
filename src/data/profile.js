/**
 * Single source of truth for the facts about Vrund.
 *
 * Imported by the build-time SEO scripts (scripts/*.mjs) so the crawler-facing
 * HTML, llms.txt and structured data can never drift from each other. Plain
 * data only — no JSX, no browser APIs — so Node can import it directly.
 */
export const profile = {
  name: 'Vrund Patel',
  role: 'AI/ML Engineer',
  site: 'https://vrund.dev',
  email: 'vrund765patel@gmail.com',
  github: 'https://github.com/vrund2005',
  linkedin: 'https://www.linkedin.com/in/patel-vrund/',
  education: 'B.E. Computer Science & Engineering (Data Science), VGEC',
  internships: ['iQud Informatics', 'Bacancy'],
  availability: 'Open to full-time AI/ML engineering roles and freelance AI projects',
  summary:
    'Vrund Patel is an AI/ML engineer who builds Agentic AI, computer vision and generative AI systems that reach production.',
  // Home page <meta name="description">; index.html carries the same text for the pre-build shell
  metaDescription:
    'Vrund Patel is an AI/ML Engineer at iQud Informatics, building Agentic AI, computer vision and GenAI systems that reach production. CSE (Data Science) at VGEC; previously interned at Bacancy Technology. See projects, deep-dive writing, and how to hire him.',
  bio: [
    "I'm an AI/ML engineer who likes models best when they're deployed. Through internships at iQud Informatics and Bacancy, I've built and shipped deep learning and computer-vision systems that solve real problems — not just benchmarks.",
    'Day to day, that means working across OpenCV, Agentic AI, NLP, and model optimization — with a bias for ML that scales beyond the demo.',
  ],
  focus: [
    'Agentic AI — LangGraph, the Model Context Protocol (MCP), FastMCP, multi-step agent workflows with tools and feedback loops',
    'Generative AI — retrieval-augmented generation (RAG), LangChain, FAISS, ChromaDB, embeddings, hybrid retrieval and reranking',
    'Computer vision — OpenCV, YOLO, object detection, image classification and segmentation, transfer learning and fine tuning',
    'Machine learning — TensorFlow, Keras, scikit-learn, CNNs, LSTMs, Transformers, NLP',
    'Data & tooling — Python, SQL, Pandas, NumPy, Power BI, FastAPI, AWS (SageMaker, Lambda, S3, EC2), n8n automation, Git',
  ],
  hiring: [
    {
      tag: 'Full-time',
      title: 'Deploy me on your team',
      description:
        'Looking for an AI/ML engineer who ships? I build agentic systems, computer-vision pipelines, and GenAI products end to end.',
    },
    {
      tag: 'Freelance',
      title: 'Build your idea with me',
      description:
        'Have a product idea or a workflow that needs automating? I scope it, build it, and hand it over production-ready.',
    },
  ],
}
