<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = $request->user()
            ->categories()
            ->orderBy('type')
            ->orderBy('order')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'  => 'required|string|max:80',
            'icon'  => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'type'  => 'required|in:income,expense',
            'order' => 'nullable|integer|min:0',
        ]);

        $data['user_id'] = $request->user()->id;
        $data['order'] ??= $request->user()->categories()->max('order') + 1;

        $category = Category::create($data);

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        $this->authorize($request, $category);

        $data = $request->validate([
            'name'  => 'nullable|string|max:80',
            'icon'  => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'order' => 'nullable|integer|min:0',
        ]);

        $category->update(array_filter($data, fn($v) => !is_null($v)));

        return response()->json($category->fresh());
    }

    public function destroy(Request $request, Category $category)
    {
        $this->authorize($request, $category);

        // Las transacciones quedan con category_id = null (nullOnDelete)
        $category->delete();

        return response()->json(['message' => 'Categoría eliminada.']);
    }

    private function authorize(Request $request, Category $category): void
    {
        abort_if($category->user_id !== $request->user()->id, 403, 'No autorizado.');
    }
}