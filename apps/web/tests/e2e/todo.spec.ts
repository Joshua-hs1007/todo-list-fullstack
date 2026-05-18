import { expect, test, type Route } from '@playwright/test';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface MockTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  position: number;
}

const updatedTaskTitle = 'Updated onboarding task';

test('registers, creates, edits, searches, reorders, and deletes a task', async ({ page }) => {
  const userEmail = `user-${Date.now()}@example.com`;
  let nextTaskId = 1;
  let tasks: MockTask[] = [
    {
      id: 'task-0',
      title: 'Backlog task',
      description: 'Already in the queue',
      status: 'TODO',
      position: 0,
    },
  ];
  let reorderRequest: unknown = null;

  const normalizePositions = () => {
    tasks = tasks.map((task, position) => ({ ...task, position }));
  };

  const fulfillTaskList = async (route: Route) => {
    const url = new URL(route.request().url());
    const search = url.searchParams.get('search')?.toLowerCase() ?? '';
    const status = url.searchParams.get('status') as TaskStatus | null;
    const filteredTasks = tasks.filter((task) => {
      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search);
      const matchesStatus = !status || task.status === status;

      return matchesSearch && matchesStatus;
    });

    await route.fulfill({ json: { tasks: filteredTasks } });
  };

  await page.route('**/api/auth/register', async (route) => {
    await route.fulfill({
      json: { token: 'token-1', user: { id: 'user-1', email: userEmail } },
    });
  });

  await page.route('**/api/tasks/reorder', async (route) => {
    reorderRequest = route.request().postDataJSON();
    const { orderedTaskIds } = reorderRequest as { orderedTaskIds: string[] };

    tasks = orderedTaskIds
      .map((id) => tasks.find((task) => task.id === id))
      .filter((task): task is MockTask => Boolean(task));
    normalizePositions();

    await route.fulfill({ json: { tasks } });
  });

  await page.route('**/api/tasks/*', async (route) => {
    const id = new URL(route.request().url()).pathname.split('/').at(-1);

    if (id === 'reorder') {
      await route.fallback();
      return;
    }

    const task = tasks.find((item) => item.id === id);

    if (!task) {
      await route.fulfill({ status: 404, json: { error: { message: 'Task was not found.' } } });
      return;
    }

    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { task } });
      return;
    }

    if (route.request().method() === 'PATCH') {
      const input = route.request().postDataJSON() as Partial<MockTask>;
      const updatedTask = { ...task, ...input };
      tasks = tasks.map((item) => (item.id === id ? updatedTask : item));
      await route.fulfill({ json: { task: updatedTask } });
      return;
    }

    if (route.request().method() === 'DELETE') {
      tasks = tasks.filter((item) => item.id !== id);
      normalizePositions();
      await route.fulfill({ json: { id } });
      return;
    }

    await route.fallback();
  });

  await page.route('**/api/tasks?*', async (route) => {
    await fulfillTaskList(route);
  });

  await page.route('**/api/tasks', async (route) => {
    if (route.request().method() === 'GET') {
      await fulfillTaskList(route);
      return;
    }

    const input = route.request().postDataJSON() as Partial<MockTask>;
    const task: MockTask = {
      id: `task-${nextTaskId++}`,
      title: input.title ?? '',
      description: input.description,
      status: input.status ?? 'TODO',
      dueDate: input.dueDate,
      position: tasks.length,
    };
    tasks = [...tasks, task];

    await route.fulfill({ status: 201, json: { task } });
  });

  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  await page.getByLabel('Email').fill(userEmail);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  await expect(page.getByLabel('Task summary')).toContainText('Total');
  await expect(page.getByLabel('Task summary')).toContainText('1');
  await expect(page.getByRole('link', { name: 'Backlog task' })).toBeVisible();
  await expect(page.getByText('Already in the queue')).toBeVisible();

  await page.getByRole('link', { name: 'New task' }).click();
  await expect(page.getByRole('heading', { name: 'New task' })).toBeVisible();
  await page.getByLabel('Title').fill('Draft onboarding task');
  await page.getByLabel('Description').fill('Initial description');
  await page.getByRole('button', { name: 'Save task' }).click();

  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Draft onboarding task' })).toBeVisible();
  await expect(page.getByLabel('Task summary')).toContainText('2');

  await page.getByRole('link', { name: 'Draft onboarding task' }).click();
  await expect(page.getByRole('heading', { name: 'Task detail' })).toBeVisible();
  await expect(page.getByLabel('Title')).toHaveValue('Draft onboarding task');
  await page.getByLabel('Title').fill(updatedTaskTitle);
  await page.getByLabel('Description').fill('Updated description');
  await page.getByLabel('Status').selectOption('IN_PROGRESS');
  await page.getByRole('button', { name: 'Save task' }).click();

  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  await page.getByPlaceholder('Search by title or description').fill('Updated');
  await expect(page.getByRole('link', { name: updatedTaskTitle })).toBeVisible();
  await expect(page.getByText('Updated description')).toBeVisible();
  await expect(page.getByText('in progress', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Backlog task' })).toBeHidden();

  await page.getByPlaceholder('Search by title or description').fill('');
  await expect(page.getByRole('link', { name: 'Backlog task' })).toBeVisible();

  const backlogTask = page.getByRole('link', { name: 'Backlog task' });
  const updatedTask = page.getByRole('link', { name: updatedTaskTitle });
  const backlogTaskCard = page.locator('.cdk-drag').filter({ hasText: 'Backlog task' });
  const updatedTaskCard = page.locator('.cdk-drag').filter({ hasText: updatedTaskTitle });
  await expect(backlogTask).toBeVisible();
  await expect(updatedTask).toBeVisible();
  const backlogBox = await backlogTaskCard.boundingBox();
  const updatedBox = await updatedTaskCard.boundingBox();
  expect(backlogBox).not.toBeNull();
  expect(updatedBox).not.toBeNull();
  await page.mouse.move(backlogBox!.x + 24, backlogBox!.y + backlogBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(backlogBox!.x + 24, backlogBox!.y + backlogBox!.height + 16, { steps: 6 });
  await page.mouse.move(updatedBox!.x + 24, updatedBox!.y + updatedBox!.height + 16, { steps: 12 });
  await page.mouse.up();
  await expect.poll(() => reorderRequest).toEqual({ orderedTaskIds: ['task-1', 'task-0'] });
  await expect(updatedTask).toBeVisible();

  await page.getByRole('button', { name: 'Delete task' }).first().click();
  await expect(page.getByRole('dialog', { name: 'Delete task?' })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(updatedTaskTitle);
  await page.getByRole('dialog').getByRole('button', { name: 'Delete task' }).click();

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('link', { name: updatedTaskTitle })).toBeHidden();
  await expect(page.getByRole('link', { name: 'Backlog task' })).toBeVisible();
  await expect(page.getByLabel('Task summary')).toContainText('1');
});
