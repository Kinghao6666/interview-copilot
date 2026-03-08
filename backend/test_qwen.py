"""
快速测试脚本 - 验证 LLM API 是否正常工作
"""
import asyncio
from app.services.qwen import qwen_service
from app.config import settings

async def run_llm_api_smoke_test():
    print(f"Mock mode: {settings.is_mock_mode}")
    print(f"Provider: {settings.llm_provider}")
    print(f"Model: {settings.llm_model}")
    print(f"API Base: {settings.llm_api_base}")
    print("-" * 50)

    # Test 1: 简单评估
    print("\n测试 1: 评估一个简短回答")
    result = await qwen_service.evaluate_answer(
        question="请解释一下 Python 的 GIL 是什么？",
        answer="GIL 是全局解释器锁。",
    )
    print(f"得分: {result['score']}")
    print(f"反馈: {result['feedback']}")
    print(f"优点: {result['strengths']}")
    print(f"改进: {result['improvements']}")

    print("\n" + "=" * 50)

    # Test 2: 评估一个详细回答
    print("\n测试 2: 评估一个详细回答")
    result2 = await qwen_service.evaluate_answer(
        question="请解释一下 Python 的 GIL 是什么？",
        answer="""GIL（Global Interpreter Lock，全局解释器锁）是 CPython 解释器中的一个互斥锁，
        它确保同一时刻只有一个线程在执行 Python 字节码。这是因为 CPython 的内存管理不是线程安全的。

        GIL 的影响：
        1. CPU 密集型任务无法利用多核优势
        2. I/O 密集型任务影响较小，因为 I/O 操作会释放 GIL
        3. 可以通过多进程或使用 C 扩展来绕过 GIL

        实际应用中，如果需要并行计算，可以使用 multiprocessing 模块或者 Cython、NumPy 等库。""",
    )
    print(f"得分: {result2['score']}")
    print(f"反馈: {result2['feedback']}")
    print(f"优点: {result2['strengths']}")
    print(f"改进: {result2['improvements']}")

if __name__ == "__main__":
    asyncio.run(run_llm_api_smoke_test())
