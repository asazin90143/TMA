'use server'

import { db } from '@/lib/db'
import { calculatePriority } from '@/lib/utils/calculate-priority'
import { createTaskSchema } from '@/lib/validations/task'

export async function createTask(input: unknown) {
    // Validate input
    const validated = createTaskSchema.parse(input)

    // TODO: Implement proper authentication (e.g., NextAuth)
    // For now, using a fixed user ID for the Render database transition
    const userId = 'user_00000000-0000-0000-0000-000000000000';

    // Calculate initial priority
    const priority = calculatePriority({
        title: validated.title,
        description: validated.description,
        dueDate: validated.due_date,
        manualPriority: validated.manual_priority,
        createdAt: new Date().toISOString(),
    })

    try {
        // Create task with calculated priority using SQL
        const result = await db.query(
            `INSERT INTO tasks (
                title, 
                description, 
                status, 
                priority_score, 
                due_date, 
                eisenhower_category, 
                created_by,
                manual_priority
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`,
            [
                validated.title,
                validated.description,
                validated.status,
                priority.score,
                validated.due_date,
                priority.eisenhower_category,
                userId,
                validated.manual_priority
            ]
        );

        return { success: true, task: result.rows[0] }
    } catch (error: any) {
        console.error('Database Error:', error);
        return { success: false, error: `${error.message} - Code: ${(error as any).code} - Detail: ${(error as any).detail}` };
    }
}