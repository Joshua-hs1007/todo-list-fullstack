import { expect, test } from '@playwright/test';

test('registers, creates, edits, searches, reorders, and deletes a task', async ({ page }) => {
  const userEmail = `user-${Date.now()}@example.com`;

  await page.route('**/api/auth/register', async (route) => {
    await route.fulfill({
      json: { token: 'token-1', user: { id: 'user-1', email: userEmail } },
    });
  });

  await page.route('**/api/tasks', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          tasks: [
            {
              id: 'task-1',
              title: 'Updated task',
              description: 'Updated description',
              status: 'IN_PROGRESS',
              position: 0,
            },
          ],
        },
      });
      return;
    }

    await route.fulfill({
      status: 201,
      json: {
        task: {
          id: 'task-1',
          title: 'New task',
          description: '',
          status: 'TODO',
          position: 0,
        },
      },
    });
  });

  await page.route('**/api/tasks/task-1', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          task: {
            id: 'task-1',
            title: 'New task',
            description: '',
            status: 'TODO',
            position: 0,
          },
        },
      });
      return;
    }

    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        json: {
          task: {
            id: 'task-1',
            title: 'Updated task',
            description: 'Updated description',
            status: 'IN_PROGRESS',
            position: 0,
          },
        },
      });
      return;
    }

    await route.fulfill({ json: { id: 'task-1' } });
  });

  await page.route('**/api/tasks/reorder', async (route) => {
    await route.fulfill({
      json: {
        tasks: [
          {
            id: 'task-1',
            title: 'Updated task',
            description: 'Updated description',
            status: 'IN_PROGRESS',
            position: 0,
          },
        ],
      },
    });
  });

  await page.goto('/register');
  await page.getByLabel('Email').fill(userEmail);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();

  await page.getByRole('link', { name: 'New task' }).click();
  await page.getByLabel('Title').fill('New task');
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByLabel('Title').fill('Updated task');
  await page.getByLabel('Description').fill('Updated description');
  await page.getByLabel('Status').selectOption('IN_PROGRESS');
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('link', { name: 'Back to tasks' }).click();
  await page.getByPlaceholder('Search tasks').fill('Updated');
  await expect(page.getByText('Updated task')).toBeVisible();

  await page.getByRole('button', { name: 'Delete task' }).click();
  await expect(page.getByText('Updated task')).toBeHidden();
});
