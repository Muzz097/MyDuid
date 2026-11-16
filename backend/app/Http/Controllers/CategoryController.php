<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    private function find(Request $request, int|string $id): Category
    {
        return $request->user()->categories()->findOrFail($id);
    }

    public function index(Request $request)
    {
        $filters = $request->validate([
            'type' => ['sometimes', 'required', Rule::in(['income', 'expense'])],
            'active' => ['sometimes', 'required', Rule::in(['1'])],
        ], [
            'type.required' => 'Jenis kategori wajib dipilih.',
            'type.in' => 'Jenis kategori tidak valid.',
            'active.required' => 'Filter status kategori wajib diisi.',
            'active.in' => 'Filter status kategori tidak valid.',
        ]);

        $categories = $request->user()->categories()
            ->when(isset($filters['type']), fn ($query) => $query->where('type', $filters['type']))
            ->when(isset($filters['active']), fn ($query) => $query->where('is_active', true))
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $category = $request->user()->categories()->create([
            'name' => $data['name'],
            'type' => $data['type'],
            'icon_key' => $data['icon_key'] ?? 'default',
        ]);

        return (new CategoryResource($category->refresh()))->response()->setStatusCode(201);
    }

    public function show(Request $request, string $category)
    {
        $model = $this->find($request, $category);
        $this->authorize('view', $model);

        return new CategoryResource($model);
    }

    public function update(UpdateCategoryRequest $request, string $category)
    {
        $model = $this->find($request, $category);
        $this->authorize('update', $model);
        $model->update($request->validated());

        return new CategoryResource($model->refresh());
    }

    public function archive(Request $request, string $category)
    {
        $model = $this->find($request, $category);
        $this->authorize('update', $model);
        $model->update(['is_active' => false]);

        return new CategoryResource($model->refresh());
    }

    public function destroy(Request $request, string $category)
    {
        $model = $this->find($request, $category);
        $this->authorize('delete', $model);

        if ($model->transactions()->withTrashed()->exists()) {
            return response()->json(['message' => 'Kategori sudah digunakan, arsipkan saja.'], 422);
        }

        $model->delete();

        return response()->noContent();
    }
}
