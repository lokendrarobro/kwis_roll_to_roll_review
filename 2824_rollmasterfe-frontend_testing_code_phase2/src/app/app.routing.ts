import { Route } from "@angular/router";
import { AuthGuard } from "app/core/auth/guards/auth.guard";
import { NoAuthGuard } from "app/core/auth/guards/noAuth.guard";
import { LayoutComponent } from "app/layout/layout.component";
import { InitialDataResolver } from "app/app.resolvers";
// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
  // Redirect empty path to '/example'

  {
    path: "",
    pathMatch: "full",
    redirectTo: "dashboards/roll",
  },
  {
    path: "review_and_repair",
    pathMatch: "full",
    redirectTo: "dashboards/roll",
  },
  {
    path: "",
    component: LayoutComponent,
    resolve: {
      initialData: InitialDataResolver,
    },
    children: [
      // Dashboards
      {
        path: "dashboards",
        children: [
          {
            path: "roll",
            loadChildren: () =>
              import(
                "app/modules/admin/dashboards/project/project.module"
              ).then((m) => m.ProjectModule),
          },
          {
            path: "projects",
            loadChildren: () =>
              import(
                "app/modules/admin/dashboards/project/project.module"
              ).then((m) => m.ProjectModule),
          },
        ],
      }
    ],
  },
  // Admin routes
  {
    path: "",
    canMatch: [AuthGuard],
    component: LayoutComponent,
    resolve: {
      initialData: InitialDataResolver,
    },
    children: [
      // Role-Details
      {
        path: "roll-details",
        loadChildren: () =>
          import("app/modules/admin/role-details/role-details.module").then(
            (m) => m.RoleDetailsModule
          ),
      },
      // merge-edit
      {
        path: "review",
        loadChildren: () =>
          import("app/modules/admin/merge-edit/merge-edit.module").then(
            (m) => m.MergeEditModule
          ),
      },
      // Repair
      {
        path: "repair",
        loadChildren: () =>
          import("app/modules/admin/repair/repair.module").then(
            (m) => m.RepairModule
          ),
      },
      // Role Width
      {
        path: "role-width",
        loadChildren: () =>
          import("app/modules/admin/role-width/role-width.module").then(
            (m) => m.RoleWidthModule
          ),
      },
      // model
      {
        path: "model-list",
        loadChildren: () =>
          import("app/modules/admin/model-list/model-list.module").then(
            (m) => m.ModelListModule
          ),
      },
      {
        path: "settings",
        loadChildren: () =>
          import("app/modules/admin/settings/settings.module").then(
            (m) => m.SettingsModule
          ),
      },
    ],
  },
];
