'use server'

import { db } from '@/lib/db'
import { calculatePriority } from '@/lib/utils/calculate-priority'

export interface ClassifyTaskInput {
    taskId: string
    title: string
    description?: string | null
    dueDate?: string | null
    manualPriority?: string | null
}

export interface ClassifyTaskResult {
    success: boolean
    eisenhower_category?: 'do_first' | 'schedule' | 'delegate' | 'delete'
    priority_score?: number
    reasoning?: string
    error?: string
}

/**
 * Classifies a task using rule-based priority calculation.
 * No external API required - instant results.
 */
export async function classifyTask(
    input: ClassifyTaskInput
): Promise<ClassifyTaskResult> {
    try {
        // Fetch task to get created_at timestamp
        const fetchResult = await db.query(
            'SELECT id, created_at FROM tasks WHERE id = $1',
            [input.taskId]
        );
        const task = fetchResult.rows[0];

        if (!task) {
            return {
                success: false,
                error: 'Task not found or access denied',
            }
        }

        // Calculate priority using rule-based algorithm
        const classification = calculatePriority({
            title: input.title,
            description: input.description,
            dueDate: input.dueDate,
            manualPriority: input.manualPriority as 'low' | 'medium' | 'high' | 'critical' | null,
            createdAt: task.created_at,
        })

        // Update task in database
        await db.query(
            `UPDATE tasks 
             SET eisenhower_category = $1, 
                 priority_score = $2, 
                 updated_at = $3 
             WHERE id = $4`,
            [
                classification.eisenhower_category,
                classification.score,
                new Date().toISOString(),
                input.taskId
            ]
        );

        return {
            success: true,
            eisenhower_category: classification.eisenhower_category,
            priority_score: classification.score,
            reasoning: classification.reasoning,
        }
    } catch (error) {
        console.error('Error classifying task:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}