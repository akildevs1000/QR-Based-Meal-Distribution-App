<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $matrix = [
            'Dashboard' => [
                ['key' => 'dashboard.view', 'label' => 'View dashboard'],
            ],
            'Transactions' => [
                ['key' => 'logs.view',   'label' => 'View transactions'],
                ['key' => 'logs.export', 'label' => 'Export transactions'],
            ],
            'Employees' => [
                ['key' => 'employees.view',   'label' => 'View employees'],
                ['key' => 'employees.create', 'label' => 'Create employees'],
                ['key' => 'employees.update', 'label' => 'Update employees'],
                ['key' => 'employees.delete', 'label' => 'Delete employees'],
            ],
            'Distribution Points' => [
                ['key' => 'sites.view',   'label' => 'View distribution points'],
                ['key' => 'sites.create', 'label' => 'Create distribution points'],
                ['key' => 'sites.update', 'label' => 'Update distribution points'],
                ['key' => 'sites.delete', 'label' => 'Delete distribution points'],
            ],
            'Suppliers' => [
                ['key' => 'suppliers.view',   'label' => 'View suppliers'],
                ['key' => 'suppliers.create', 'label' => 'Create suppliers'],
                ['key' => 'suppliers.update', 'label' => 'Update suppliers'],
                ['key' => 'suppliers.delete', 'label' => 'Delete suppliers'],
            ],
            'Meal Rules' => [
                ['key' => 'meal-rules.view',   'label' => 'View meal rules'],
                ['key' => 'meal-rules.create', 'label' => 'Create meal rules'],
                ['key' => 'meal-rules.update', 'label' => 'Update meal rules'],
                ['key' => 'meal-rules.delete', 'label' => 'Delete meal rules'],
            ],
            'Meal Categories' => [
                ['key' => 'meal-categories.view',   'label' => 'View meal categories'],
                ['key' => 'meal-categories.create', 'label' => 'Create meal categories'],
                ['key' => 'meal-categories.update', 'label' => 'Update meal categories'],
                ['key' => 'meal-categories.delete', 'label' => 'Delete meal categories'],
            ],
            'Food Requests' => [
                ['key' => 'food-requests.view',   'label' => 'View food requests'],
                ['key' => 'food-requests.create', 'label' => 'Create food requests'],
                ['key' => 'food-requests.update', 'label' => 'Update food requests'],
                ['key' => 'food-requests.delete', 'label' => 'Delete food requests'],
            ],
            'Delivery Notes' => [
                ['key' => 'delivery-notes.view',   'label' => 'View delivery notes'],
                ['key' => 'delivery-notes.create', 'label' => 'Create delivery notes'],
                ['key' => 'delivery-notes.update', 'label' => 'Update delivery notes'],
                ['key' => 'delivery-notes.delete', 'label' => 'Delete delivery notes'],
            ],
            'Complaints' => [
                ['key' => 'complaints.view',   'label' => 'View complaints'],
                ['key' => 'complaints.create', 'label' => 'Create complaints'],
                ['key' => 'complaints.update', 'label' => 'Update complaints'],
                ['key' => 'complaints.delete', 'label' => 'Delete complaints'],
            ],
            'Reports' => [
                ['key' => 'reports.view', 'label' => 'View reports'],
            ],
            'Users' => [
                ['key' => 'users.view',   'label' => 'View users'],
                ['key' => 'users.create', 'label' => 'Create users'],
                ['key' => 'users.update', 'label' => 'Update users'],
                ['key' => 'users.delete', 'label' => 'Delete users'],
            ],
            'Roles' => [
                ['key' => 'roles.view',   'label' => 'View roles'],
                ['key' => 'roles.create', 'label' => 'Create roles'],
                ['key' => 'roles.update', 'label' => 'Update roles'],
                ['key' => 'roles.delete', 'label' => 'Delete roles'],
            ],
            'Settings' => [
                ['key' => 'settings.view',   'label' => 'View settings'],
                ['key' => 'settings.update', 'label' => 'Update settings'],
            ],
        ];

        $groupSort = 0;
        foreach ($matrix as $group => $items) {
            $groupSort += 100;
            $sort = 0;
            foreach ($items as $item) {
                $sort++;
                Permission::updateOrCreate(
                    ['key' => $item['key']],
                    [
                        'label' => $item['label'],
                        'group' => $group,
                        'sort'  => $groupSort + $sort,
                    ]
                );
            }
        }
    }
}
