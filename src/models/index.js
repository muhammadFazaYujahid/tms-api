import { Organization } from "./Organization.js";
import { User, UserHasNotif, UserHasOrg } from "./User.js";
import { MemberHasProject, Workspace, WorkspaceMember } from "./Workspace.js";
import { Team, TeamMember, TeamHasProject } from "./Team.js";
import Project from "./Project.js";
import Sprint from "./Sprint.js";
import { Task, TaskHandler, TaskWatcher, TaskActivities, TaskStatus, TaskAttachement, TaskCommentHistory, VotedTask, TaskIssue, } from "./Task.js";
// import Notification from "./Notification.js";
import Client from "./Client.js";

Organization.hasMany(User, { foreignKey: "org_key", sourceKey: "org_key" });
User.belongsTo(Organization, { foreignKey: "org_key", targetKey: "org_key" });

Organization.hasMany(Workspace, { foreignKey: "org_key", sourceKey: "org_key" });
Workspace.belongsTo(Organization, { foreignKey: "org_key", targetKey: "org_key" });

Workspace.hasMany(Team, { foreignKey: "work_key", sourceKey: "work_key" });
Team.belongsTo(Workspace, { foreignKey: "work_key", targetKey: "work_key" });

Workspace.hasMany(WorkspaceMember, { foreignKey: "work_key", sourceKey: 'work_key' });
WorkspaceMember.belongsTo(Workspace, { foreignKey: "work_key", targetKey: "work_key" });

// WorkspaceMember.hasOne(User, { foreignKey: "user_key", sourceKey: 'user_key' });
// User.belongsTo(WorkspaceMember, { foreignKey: "user_key", sourceKey: "user_key" });

Team.hasMany(WorkspaceMember, { foreignKey: "team_key", sourceKey: "team_key" });
WorkspaceMember.belongsTo(Team, { foreignKey: "team_key", targetKey: "team_key" });

User.hasMany(WorkspaceMember, { foreignKey: "user_key", sourceKey: "user_key" });
WorkspaceMember.belongsTo(User, { foreignKey: "user_key", targetKey: "user_key" });

Team.hasMany(TeamHasProject, { foreignKey: "team_key", sourceKey: "team_key" });
TeamHasProject.belongsTo(Team, { foreignKey: "team_key", targetKey: "team_key" });

Project.hasMany(TeamHasProject, { as: "teammate", foreignKey: "project_key", sourceKey: "project_key" });
TeamHasProject.belongsTo(Project, { as: "teammate", foreignKey: "project_key", targetKey: "project_key" });

WorkspaceMember.hasMany(MemberHasProject, { foreignKey: "member_key", sourceKey: "member_key" });
MemberHasProject.belongsTo(WorkspaceMember, { foreignKey: "member_key", targetKey: "member_key" });

Project.hasMany(MemberHasProject, { foreignKey: "project_key", sourceKey: "project_key" });
MemberHasProject.belongsTo(Project, { foreignKey: "project_key", targetKey: "project_key" });

Project.belongsTo(Client, { foreignKey: "client_key", targetKey: "client_key" })

Project.hasMany(Sprint, { foreignKey: "project_key", sourceKey: "project_key" });
Sprint.belongsTo(Project, { foreignKey: "project_key" });

//not workint, association tiba - tiba jadi workspace.sork_key = project.id
// Project.hasOne(Workspace, { foreignKey: "work_key", targetKey: "work_key" });
// Workspace.belongsTo(Project, { foreignKey: "work_key", targetKey: "work_key" });

Sprint.hasMany(Task, { foreignKey: "sprint_key", sourceKey: "sprint_key" });
Task.belongsTo(Sprint, { foreignKey: "sprint_key", sourceKey: "sprint_key" });

Task.belongsTo(TaskStatus, { foreignKey: "status_key", targetKey: "status_key" });

Task.belongsTo(User, { as: "reporter_task", foreignKey: "reporter", targetKey: "user_key" });

Task.hasMany(TaskHandler, { foreignKey: "task_key", sourceKey: "task_key" });
TaskHandler.belongsTo(Task, { foreignKey: "task_key", sourceKey: "task_key" });

Task.hasMany(TaskIssue, { foreignKey: "task_key", sourceKey: "task_key" });
TaskIssue.belongsTo(Task, { foreignKey: "task_key", sourceKey: "task_key" });

User.hasMany(TaskHandler, { foreignKey: "handler", sourceKey: "user_key" })
TaskHandler.belongsTo(User, { foreignKey: "handler", sourceKey: "user_key" })

User.hasMany(TaskCommentHistory, { foreignKey: "user_key", sourceKey: "user_key" });
TaskCommentHistory.belongsTo(User, { foreignKey: "user_key", sourceKey: "user_key" });

Task.hasMany(TaskCommentHistory, { foreignKey: "task_key", sourceKey: "task_key" });
TaskCommentHistory.belongsTo(Task, { foreignKey: "task_key", sourceKey: "task_key" });

Task.hasMany(TaskWatcher, { foreignKey: "task_key", sourceKey: "task_key" });
TaskWatcher.belongsTo(Task, { foreignKey: "task_key", sourceKey: "task_key" });

User.hasMany(TaskWatcher, { foreignKey: "watcher_key", sourceKey: "user_key" })
TaskWatcher.belongsTo(User, { foreignKey: "watcher_key", sourceKey: "user_key" })

Task.hasMany(TaskActivities, { foreignKey: "task_key", sourceKey: "task_key" });
TaskActivities.belongsTo(Task, { foreignKey: "task_key", sourceKey: "task_key" });

User.hasMany(TaskActivities, { foreignKey: "user_key", sourceKey: "user_key" });
TaskActivities.belongsTo(User, { foreignKey: "user_key", sourceKey: "user_key" });

User.belongsToMany(Organization, { through: UserHasOrg, foreignKey: "user_key", sourceKey: "user_key" });
Organization.belongsToMany(User, { through: UserHasOrg, foreignKey: 'org_key', sourceKey: "org_key" });

User.hasMany(UserHasOrg, { foreignKey: "user_key", sourceKey: "user_key" });
UserHasOrg.belongsTo(User, { foreignKey: "user_key", sourceKey: "user_key" });
// User.belongsTo(UserHasOrg, { foreignKey: "user_key" })

Organization.hasMany(UserHasOrg, { foreignKey: "org_key", sourceKey: "org_key" });
UserHasOrg.belongsTo(Organization, { foreignKey: "org_key", sourceKey: "org_key" });
// Organization.belongsTo(UserHasOrg, { foreignKey: "org_key" })


VotedTask.belongsTo(Task, { foreignKey: "task_key", targetKey: "task_key" });
User.hasMany(VotedTask, { foreignKey: "user_key", sourceKey: "user_key" });
VotedTask.belongsTo(User, { foreignKey: "user_key", targetKey: "user_key" });

TaskAttachement.belongsTo(Task, { foreignKey: "task_key", targetKey: "task_key" });
TaskAttachement.belongsTo(User, { foreignKey: "upload_by", targetKey: "user_key" });

Task.hasMany(TaskCommentHistory, { as: "commnet_task", foreignKey: "task_key", sourceKey: "task_key" });
TaskCommentHistory.belongsTo(Task, { foreignKey: "task_key", targetKey: "task_key" });
User.hasMany(TaskCommentHistory, { foreignKey: "user_key", sourceKey: "user_key" });
TaskCommentHistory.belongsTo(User, { foreignKey: "user_key", targetKey: "user_key" });

User.hasMany(UserHasNotif, { foreignKey: "sender_key", sourceKey: "user_key" });
UserHasNotif.belongsTo(User, { foreignKey: "sender_key", sourceKey: "user_key" });

TaskCommentHistory.hasMany(UserHasNotif, { foreignKey: "notif_id", sourceKey: "id" });
UserHasNotif.belongsTo(TaskCommentHistory, { foreignKey: "notif_id", sourceKey: "id" });

// Notification.belongsTo(User, { foreignKey: "for_user_id", sourceKey: "id" });


// WorkspaceMember.hasMany(TeamHasPr'rjmopoject, { foreignKey: "team_key", sourceKey: "team_key" });
// TeamHasProject.belongsTo(WorkspaceMember, { foreignKey: "team_key", sourceKey: "team_key" });
// TeamHasProject.hasMany(WorkspaceMember, { foreignKey: 'team_key' });
// WorkspaceMember.belongsTo(TeamHasProject, { foreignKey: 'team_key' });
// TeamHasProject.belongsToMany(WorkspaceMember, { through: 'TeamWorkspace', foreignKey: 'team_id' });
// WorkspaceMember.belongsToMany(TeamHasProject, { through: 'TeamWorkspace', foreignKey: 'workspace_member_id' });

export {
    User,
    Organization,
    Workspace,
    Team,
    TeamMember,
    TeamHasProject,
    Project,
    Sprint,
    Task,
    TaskHandler,
    TaskWatcher,
    TaskActivities,
    TaskStatus,
    VotedTask,
    TaskAttachement,
    TaskCommentHistory,
    // Notification,
    Client,
};
