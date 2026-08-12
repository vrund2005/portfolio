export const skillGroups = [
  { group: 'Languages', skills: ['Python', 'SQL'] },
  { group: 'Cloud & MLOps', skills: ['AWS (SageMaker, Lambda, S3, CloudWatch, IAM, EC2)'] },
  { group: 'GenAI & AgenticAI', skills: ['LangChain', 'LangGraph', 'LangSmith', 'RAG', 'FAISS', 'Prompt Engineering', 'MCP', 'Hugging Face'] },
  { group: 'Computer Vision', skills: ['OpenCV', 'YOLO', 'Roboflow', 'Transfer Learning', 'Fine Tuning', 'Data Annotation', 'Object Detection', 'Image Classification', 'Image Segmentation'] },
  { group: 'Machine Learning & Deep Learning', skills: ['Scikit-learn', 'TensorFlow', 'Keras', 'CNNs', 'LSTMs', 'Transformers', 'Feature Engineering', 'Model Evaluation', 'NLP'] },
  { group: 'Data Science', skills: ['Pandas', 'Numpy', 'Matplotlib', 'Power BI'] },
  { group: 'Developer Tools', skills: ['Git', 'GitHub', 'Jupyter', 'Google Colab', 'n8n'] },
  { group: 'Familiar With', skills: ['FastAPI', 'React', 'R', 'Java', 'JavaScript'] },
]

export const allSkills = skillGroups.flatMap((group) => group.skills)
