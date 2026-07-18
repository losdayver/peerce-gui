export {};

const status = document.querySelector<HTMLElement>("#status");

async function connectToBackend(attempt = 0): Promise<void> {
  if (!status) return;

  try {
    const response = await fetch("http://127.0.0.1:4310/api/health");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = (await response.json()) as { runtime: string };
    status.textContent = `Frontend connected to ${result.runtime}`;
    status.dataset.state = "ready";
  } catch (error) {
    if (attempt < 20) {
      window.setTimeout(() => void connectToBackend(attempt + 1), 100);
      return;
    }

    status.textContent = `Backend is unavailable: ${String(error)}`;
    status.dataset.state = "error";
  }
}

void connectToBackend();
