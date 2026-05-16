<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ComplaintController;
use App\Http\Controllers\Api\CuisineController;
use App\Http\Controllers\Api\DeliveryNoteController;
use App\Http\Controllers\Api\DistributionAssignmentController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\FoodRequestController;
use App\Http\Controllers\Api\ImportController;
use App\Http\Controllers\Api\LogController;
use App\Http\Controllers\Api\MealCategoryController;
use App\Http\Controllers\Api\MealRemarkController;
use App\Http\Controllers\Api\MealRuleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\ScanController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\SiteController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SupplierMealAssignmentController;
use App\Http\Controllers\Api\SupplierPortalController;
use App\Http\Controllers\Api\SupplierUserController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/scan', [ScanController::class, 'store'])->middleware('throttle:120,1');
Route::get('/public/sites', function () {
    return \App\Models\Site::query()
        ->where('active', true)
        ->orderBy('site_code')
        ->get(['id', 'site_code', 'name', 'pin'])
        ->map(function ($s) {
            return [
                'id' => $s->id,
                'site_code' => $s->site_code,
                'name' => $s->name,
                'has_pin' => !empty($s->getAttributes()['pin']),
            ];
        });
})->middleware('throttle:60,1');
Route::post('/public/sites/{site}/verify-pin', function (\Illuminate\Http\Request $request, \App\Models\Site $site) {
    $data = $request->validate(['pin' => ['required', 'string', 'max:32']]);
    $hash = $site->getAttributes()['pin'] ?? null;
    if (!$hash) {
        return response()->json(['ok' => true, 'no_pin' => true]);
    }
    $ok = \Illuminate\Support\Facades\Hash::check($data['pin'], $hash);
    return response()->json(['ok' => $ok], $ok ? 200 : 422);
})->middleware('throttle:20,1');
Route::get('/public/settings', [SettingsController::class, 'publicIndex'])->middleware('throttle:60,1');
Route::get('/public/sites/{site}/stats', [SiteController::class, 'publicStats'])->middleware('throttle:120,1');
Route::get('/public/sites/{site}/logs', [SiteController::class, 'publicLogs'])->middleware('throttle:120,1');
Route::get('/public/meal-rules', function () {
    return \App\Models\MealRule::query()
        ->where('active', true)
        ->orderBy('start_time')
        ->get(['id', 'name', 'start_time', 'end_time']);
})->middleware('throttle:60,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    // Profile (every authenticated user can manage their own account)
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/me/profile', [AuthController::class, 'updateProfile']);
    Route::post('/me/password', [AuthController::class, 'updatePassword']);

    // Settings
    Route::get('/settings', [SettingsController::class, 'index'])->middleware('permission:settings.view');
    Route::put('/settings', [SettingsController::class, 'update'])->middleware('permission:settings.update');
    Route::post('/settings/logo', [SettingsController::class, 'uploadLogo'])->middleware('permission:settings.update');
    Route::delete('/settings/logo', [SettingsController::class, 'deleteLogo'])->middleware('permission:settings.update');

    // Employees
    Route::post('/employees/import',   [ImportController::class, 'employees'])->middleware('permission:employees.import');
    Route::get('/employees',           [EmployeeController::class, 'index'])->middleware('permission:employees.view');
    Route::get('/employees/{employee}',[EmployeeController::class, 'show'])->middleware('permission:employees.view');
    Route::post('/employees',          [EmployeeController::class, 'store'])->middleware('permission:employees.create');
    Route::put('/employees/{employee}',  [EmployeeController::class, 'update'])->middleware('permission:employees.update');
    Route::patch('/employees/{employee}',[EmployeeController::class, 'update'])->middleware('permission:employees.update');
    Route::delete('/employees/{employee}',[EmployeeController::class, 'destroy'])->middleware('permission:employees.delete');

    // Sites
    Route::get('/dashboard/quotas', [SiteController::class, 'quotasSummary'])->middleware('permission:dashboard.view');
    Route::get('/sites',         [SiteController::class, 'index'])->middleware('permission:sites.view');
    Route::get('/sites/{site}',  [SiteController::class, 'show'])->middleware('permission:sites.view');
    Route::post('/sites',        [SiteController::class, 'store'])->middleware('permission:sites.create');
    Route::put('/sites/{site}',  [SiteController::class, 'update'])->middleware('permission:sites.update');
    Route::patch('/sites/{site}',[SiteController::class, 'update'])->middleware('permission:sites.update');
    Route::delete('/sites/{site}',[SiteController::class, 'destroy'])->middleware('permission:sites.delete');

    // Meal Rules
    Route::get('/meal-rules',              [MealRuleController::class, 'index'])->middleware('permission:meal-rules.view');
    Route::get('/meal-rules/{mealRule}',   [MealRuleController::class, 'show'])->middleware('permission:meal-rules.view');
    Route::post('/meal-rules',             [MealRuleController::class, 'store'])->middleware('permission:meal-rules.create');
    Route::put('/meal-rules/{mealRule}',   [MealRuleController::class, 'update'])->middleware('permission:meal-rules.update');
    Route::patch('/meal-rules/{mealRule}', [MealRuleController::class, 'update'])->middleware('permission:meal-rules.update');
    Route::delete('/meal-rules/{mealRule}',[MealRuleController::class, 'destroy'])->middleware('permission:meal-rules.delete');

    // Users
    Route::get('/users',         [UserController::class, 'index'])->middleware('permission:users.view');
    Route::get('/users/{user}',  [UserController::class, 'show'])->middleware('permission:users.view');
    Route::post('/users',        [UserController::class, 'store'])->middleware('permission:users.create');
    Route::put('/users/{user}',  [UserController::class, 'update'])->middleware('permission:users.update');
    Route::patch('/users/{user}',[UserController::class, 'update'])->middleware('permission:users.update');
    Route::delete('/users/{user}',[UserController::class, 'destroy'])->middleware('permission:users.delete');

    // Roles & Permissions
    Route::get('/permissions',  [PermissionController::class, 'index'])->middleware('permission:roles.view');
    Route::get('/roles',        [RoleController::class, 'index'])->middleware('permission:roles.view');
    Route::get('/roles/{role}', [RoleController::class, 'show'])->middleware('permission:roles.view');
    Route::post('/roles',       [RoleController::class, 'store'])->middleware('permission:roles.create');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->middleware('permission:roles.update');
    Route::patch('/roles/{role}', [RoleController::class, 'update'])->middleware('permission:roles.update');
    Route::delete('/roles/{role}',[RoleController::class, 'destroy'])->middleware('permission:roles.delete');

    // Cuisines (bundled under meal-categories permissions)
    Route::get('/cuisines',           [CuisineController::class, 'index'])->middleware('permission:meal-categories.view');
    Route::get('/cuisines/{cuisine}', [CuisineController::class, 'show'])->middleware('permission:meal-categories.view');
    Route::post('/cuisines',          [CuisineController::class, 'store'])->middleware('permission:meal-categories.create');
    Route::put('/cuisines/{cuisine}', [CuisineController::class, 'update'])->middleware('permission:meal-categories.update');
    Route::patch('/cuisines/{cuisine}', [CuisineController::class, 'update'])->middleware('permission:meal-categories.update');
    Route::delete('/cuisines/{cuisine}',[CuisineController::class, 'destroy'])->middleware('permission:meal-categories.delete');

    // Meal Categories
    Route::get('/meal-categories',                [MealCategoryController::class, 'index'])->middleware('permission:meal-categories.view');
    Route::get('/meal-categories/{mealCategory}', [MealCategoryController::class, 'show'])->middleware('permission:meal-categories.view');
    Route::post('/meal-categories',               [MealCategoryController::class, 'store'])->middleware('permission:meal-categories.create');
    Route::put('/meal-categories/{mealCategory}', [MealCategoryController::class, 'update'])->middleware('permission:meal-categories.update');
    Route::patch('/meal-categories/{mealCategory}', [MealCategoryController::class, 'update'])->middleware('permission:meal-categories.update');
    Route::delete('/meal-categories/{mealCategory}',[MealCategoryController::class, 'destroy'])->middleware('permission:meal-categories.delete');

    // Suppliers (+ documents bundled under suppliers permissions)
    Route::get('/suppliers',            [SupplierController::class, 'index'])->middleware('permission:suppliers.view');
    Route::get('/suppliers/{supplier}', [SupplierController::class, 'show'])->middleware('permission:suppliers.view');
    Route::post('/suppliers',           [SupplierController::class, 'store'])->middleware('permission:suppliers.create');
    Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])->middleware('permission:suppliers.update');
    Route::patch('/suppliers/{supplier}', [SupplierController::class, 'update'])->middleware('permission:suppliers.update');
    Route::delete('/suppliers/{supplier}',[SupplierController::class, 'destroy'])->middleware('permission:suppliers.delete');
    Route::post('/suppliers/{supplier}/documents',              [SupplierController::class, 'uploadDocument'])->middleware('permission:suppliers.update');
    Route::delete('/suppliers/{supplier}/documents/{document}', [SupplierController::class, 'deleteDocument'])->middleware('permission:suppliers.update');

    // Supplier login users (admin-managed; bundled under suppliers.update)
    Route::get('/suppliers/{supplier}/users',                       [SupplierUserController::class, 'index'])->middleware('permission:suppliers.view');
    Route::post('/suppliers/{supplier}/users',                      [SupplierUserController::class, 'store'])->middleware('permission:suppliers.update');
    Route::put('/supplier-users/{supplierUser}',                    [SupplierUserController::class, 'update'])->middleware('permission:suppliers.update');
    Route::patch('/supplier-users/{supplierUser}',                  [SupplierUserController::class, 'update'])->middleware('permission:suppliers.update');
    Route::post('/supplier-users/{supplierUser}/reset-password',    [SupplierUserController::class, 'resetPassword'])->middleware('permission:suppliers.update');
    Route::delete('/supplier-users/{supplierUser}',                 [SupplierUserController::class, 'destroy'])->middleware('permission:suppliers.update');

    // Supplier Meal Assignments (bundled under suppliers permissions)
    Route::get('/supplier-meal-assignments',                            [SupplierMealAssignmentController::class, 'index'])->middleware('permission:suppliers.view');
    Route::get('/supplier-meal-assignments/{supplierMealAssignment}',   [SupplierMealAssignmentController::class, 'show'])->middleware('permission:suppliers.view');
    Route::post('/supplier-meal-assignments',                           [SupplierMealAssignmentController::class, 'store'])->middleware('permission:suppliers.update');
    Route::put('/supplier-meal-assignments/{supplierMealAssignment}',   [SupplierMealAssignmentController::class, 'update'])->middleware('permission:suppliers.update');
    Route::patch('/supplier-meal-assignments/{supplierMealAssignment}', [SupplierMealAssignmentController::class, 'update'])->middleware('permission:suppliers.update');
    Route::delete('/supplier-meal-assignments/{supplierMealAssignment}',[SupplierMealAssignmentController::class, 'destroy'])->middleware('permission:suppliers.update');

    // Distribution Assignments (bundled under sites permissions)
    Route::get('/distribution-assignments',                            [DistributionAssignmentController::class, 'index'])->middleware('permission:sites.view');
    Route::get('/distribution-assignments/{distributionAssignment}',   [DistributionAssignmentController::class, 'show'])->middleware('permission:sites.view');
    Route::post('/distribution-assignments',                           [DistributionAssignmentController::class, 'store'])->middleware('permission:sites.update');
    Route::put('/distribution-assignments/{distributionAssignment}',   [DistributionAssignmentController::class, 'update'])->middleware('permission:sites.update');
    Route::patch('/distribution-assignments/{distributionAssignment}', [DistributionAssignmentController::class, 'update'])->middleware('permission:sites.update');
    Route::delete('/distribution-assignments/{distributionAssignment}',[DistributionAssignmentController::class, 'destroy'])->middleware('permission:sites.update');

    // Food Requests
    Route::get('/food-requests',                  [FoodRequestController::class, 'index'])->middleware('permission:food-requests.view');
    Route::get('/food-requests/{foodRequest}',    [FoodRequestController::class, 'show'])->middleware('permission:food-requests.view');
    Route::post('/food-requests',                 [FoodRequestController::class, 'store'])->middleware('permission:food-requests.create');
    Route::put('/food-requests/{foodRequest}',    [FoodRequestController::class, 'update'])->middleware('permission:food-requests.update');
    Route::patch('/food-requests/{foodRequest}',  [FoodRequestController::class, 'update'])->middleware('permission:food-requests.update');
    Route::delete('/food-requests/{foodRequest}', [FoodRequestController::class, 'destroy'])->middleware('permission:food-requests.delete');

    // Delivery Notes
    Route::get('/delivery-notes',                  [DeliveryNoteController::class, 'index'])->middleware('permission:delivery-notes.view');
    Route::get('/delivery-notes/{deliveryNote}',   [DeliveryNoteController::class, 'show'])->middleware('permission:delivery-notes.view');
    Route::post('/delivery-notes',                 [DeliveryNoteController::class, 'store'])->middleware('permission:delivery-notes.create');
    Route::put('/delivery-notes/{deliveryNote}',   [DeliveryNoteController::class, 'update'])->middleware('permission:delivery-notes.update');
    Route::patch('/delivery-notes/{deliveryNote}', [DeliveryNoteController::class, 'update'])->middleware('permission:delivery-notes.update');
    Route::delete('/delivery-notes/{deliveryNote}',[DeliveryNoteController::class, 'destroy'])->middleware('permission:delivery-notes.delete');

    // Meal Remarks (admin view + admin posts as "Timekeeper")
    Route::get('/meal-remarks',                 [MealRemarkController::class, 'index'])->middleware('permission:meal-remarks.view');
    Route::post('/meal-remarks',                [MealRemarkController::class, 'store'])->middleware('permission:meal-remarks.create');
    Route::delete('/meal-remarks/{mealRemark}', [MealRemarkController::class, 'destroy'])->middleware('permission:meal-remarks.delete');

    // Complaints
    Route::get('/complaints',              [ComplaintController::class, 'index'])->middleware('permission:complaints.view');
    Route::get('/complaints/{complaint}',  [ComplaintController::class, 'show'])->middleware('permission:complaints.view');
    Route::post('/complaints',             [ComplaintController::class, 'store'])->middleware('permission:complaints.create');
    Route::put('/complaints/{complaint}',  [ComplaintController::class, 'update'])->middleware('permission:complaints.update');
    Route::patch('/complaints/{complaint}',[ComplaintController::class, 'update'])->middleware('permission:complaints.update');
    Route::delete('/complaints/{complaint}',[ComplaintController::class, 'destroy'])->middleware('permission:complaints.delete');

    // Logs
    Route::get('/logs',         [LogController::class, 'index'])->middleware('permission:logs.view');
    Route::get('/logs/export',  [LogController::class, 'export'])->middleware('permission:logs.export');

    // Reports
    Route::get('/reports',         [ReportController::class, 'catalog'])->middleware('permission:reports.view');
    Route::get('/reports/{key}',   [ReportController::class, 'run'])->middleware('permission:reports.view');
});

// Supplier portal (supplier-typed tokens only)
Route::middleware(['auth:sanctum', 'supplier.user'])->prefix('supplier')->group(function () {
    Route::get('/dashboard',       [SupplierPortalController::class, 'dashboard']);
    Route::get('/food-requests',   [SupplierPortalController::class, 'foodRequests']);
    Route::get('/delivery-notes',  [SupplierPortalController::class, 'deliveryNotes']);
    Route::get('/complaints',      [SupplierPortalController::class, 'complaints']);
    Route::get('/assignments',     [SupplierPortalController::class, 'assignments']);
    Route::get('/sites',           [SupplierPortalController::class, 'sites']);
    Route::get('/meal-rules',      [SupplierPortalController::class, 'mealRules']);
    Route::get('/profile',         [SupplierPortalController::class, 'profile']);
    Route::patch('/profile',       [SupplierPortalController::class, 'updateProfile']);
    Route::post('/password',       [SupplierPortalController::class, 'updatePassword']);

    // Write actions
    Route::post('/delivery-notes/{deliveryNote}/confirm', [SupplierPortalController::class, 'confirmDelivery']);
    Route::post('/complaints/{complaint}/respond',        [SupplierPortalController::class, 'respondToComplaint']);
    Route::get('/meal-remarks',                            [SupplierPortalController::class, 'mealRemarks']);
    Route::post('/meal-remarks',                           [SupplierPortalController::class, 'storeMealRemark']);
    Route::delete('/meal-remarks/{mealRemark}',            [SupplierPortalController::class, 'destroyMealRemark']);
});
