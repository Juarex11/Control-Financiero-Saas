<?php

namespace App\Http\Controllers;

use App\Models\ReminderCategory;
use Illuminate\Http\Request;

class ReminderCategoryController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->reminderCategories()->orderBy('order')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'  => 'required|string|max:80',
            'color' => 'nullable|string|max:7',
            'icon'  => 'nullable|string|max:50',
            'order' => 'nullable|integer|min:0',
        ]);

        $data['user_id'] = $request->user()->id;
        $data['order'] ??= $request->user()->reminderCategories()->max('order') + 1;

        return response()->json(ReminderCategory::create($data), 201);
    }

    public function update(Request $request, ReminderCategory $reminderCategory)
    {
        abort_if($reminderCategory->user_id !== $request->user()->id, 403);

        $data = $request->validate([
            'name'  => 'nullable|string|max:80',
            'color' => 'nullable|string|max:7',
            'icon'  => 'nullable|string|max:50',
            'order' => 'nullable|integer|min:0',
        ]);

        $reminderCategory->update(array_filter($data, fn($v) => !is_null($v)));
        return response()->json($reminderCategory->fresh());
    }

    public function destroy(Request $request, ReminderCategory $reminderCategory)
    {
        abort_if($reminderCategory->user_id !== $request->user()->id, 403);
        $reminderCategory->delete();
        return response()->json(['message' => 'Categoría eliminada.']);
    }
}