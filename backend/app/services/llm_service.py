from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from app.config import settings
from typing import AsyncGenerator, List, Dict
import json

class LLMService:
    def __init__(self):
        # Use Groq for fast responses (free tier available)
        if settings.groq_api_key:
            self.llm = ChatGroq(
                api_key=settings.groq_api_key,
                model_name="llama-3.1-8b-instant",
                temperature=0.7,
                streaming=True
            )
        else:
            self.llm = ChatOpenAI(
                api_key=settings.openai_api_key,
                model="gpt-3.5-turbo",
                temperature=0.7,
                streaming=True
            )
        
        self.system_prompt = """You are a helpful AI assistant. You provide accurate, helpful, and friendly responses.

When provided with context from documents or web search, use that information to answer questions accurately.
Always cite your sources when using external information.

If you don't know something, say so honestly. Be concise but thorough."""

    def _format_context(self, rag_context: List[Dict] = None, web_context: List[Dict] = None) -> str:
        context_parts = []
        
        if rag_context:
            context_parts.append("=== Document Context ===")
            for i, doc in enumerate(rag_context, 1):
                context_parts.append(f"[Doc {i}] {doc.get('source', 'Unknown')}: {doc.get('content', '')}")
        
        if web_context:
            context_parts.append("\n=== Web Search Results ===")
            for i, result in enumerate(web_context, 1):
                context_parts.append(f"[Web {i}] {result.get('title', 'Unknown')}: {result.get('snippet', '')}")
        
        return "\n".join(context_parts)

    def _format_messages(self, chat_history: List[Dict]) -> List:
        messages = []
        for msg in chat_history[-10:]:  # Keep last 10 messages for context
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
        return messages

    async def generate_response(
        self,
        message: str,
        chat_history: List[Dict] = None,
        rag_context: List[Dict] = None,
        web_context: List[Dict] = None
    ) -> str:
        context = self._format_context(rag_context, web_context)
        
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt + ("\n\nContext:\n" + context if context else "")),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}")
        ])
        
        chain = prompt_template | self.llm | StrOutputParser()
        
        history = self._format_messages(chat_history or [])
        
        response = await chain.ainvoke({
            "input": message,
            "chat_history": history
        })
        
        return response

    async def generate_stream(
        self,
        message: str,
        chat_history: List[Dict] = None,
        rag_context: List[Dict] = None,
        web_context: List[Dict] = None
    ) -> AsyncGenerator[str, None]:
        context = self._format_context(rag_context, web_context)
        
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt + ("\n\nContext:\n" + context if context else "")),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}")
        ])
        
        chain = prompt_template | self.llm
        
        history = self._format_messages(chat_history or [])
        
        async for chunk in chain.astream({
            "input": message,
            "chat_history": history
        }):
            if hasattr(chunk, 'content'):
                yield chunk.content

    async def generate_title(self, first_message: str) -> str:
        prompt = f"Generate a short, concise title (max 5 words) for a conversation that starts with: '{first_message}'. Return only the title, no quotes or extra text."
        
        response = await self.llm.ainvoke([HumanMessage(content=prompt)])
        return response.content.strip()[:50]

llm_service = LLMService()