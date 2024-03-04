import express from "express";
import {
    createClient,
    deleteClient,
    findOrganization,
    getClient,
    getOrgByUserId,
    listOrganization,
    nonTeamMember,
    searchMember,
    updateClient,
} from "../controllers/organization.js";
import { checkAuth } from "../middleware/authUser.js";
import {
    createWorkspace,
    findMemberWorkspace,
    findWorkspace,
    getMember,
    kickMember,
    inviteToWorkspace,
    listWorkspace,
    addMemberToTeam,
    deleteWorkspace,
    findMemberByWorkspace,
    getWorkspaceActivity,
    workspaceMemberReport,
    getMemberRole,
} from "../controllers/workspace.js";
import {
    addMemberTeam,
    createTeam,
    deleteTeam,
    editTeamName,
    findAllTeam,
    findMemberTeam,
    getTeamMember,
    getTeamProject,
    teamDetail,
    teamProject,
} from "../controllers/team.js";
import { createProject, deleteProject, editProjectName, getProjectHandler, inviteMember, projectDetail, projectList, removeMember, searchMemberProject, userPhotoName, user_photo } from "../controllers/project.js";
import { completeSprint, createSprint, deleteSprint, editSprint, getBacklog, getSprint, startSprint } from "../controllers/sprint.js";
import {
    addWatch,
    attachmentByTask,
    changeDescTask,
    changeNameAttachment,
    changeSprint,
    changeTaskStatus,
    commentTask,
    createIssue,
    createTask,
    deleteComment,
    deleteIssue,
    deleteTask,
    deletedAttachment,
    detailTask,
    editParent,
    editTaskDetail,
    flagTask,
    getAttachFile,
    getChildTask,
    getCommentHistory,
    getTaskByName,
    getTaskDetail,
    getTaskIssue,
    getTaskStatus,
    getTaskVote,
    getWatcher,
    listTask,
    removeChild,
    removeWatch,
    shareTask,
    taskAttachment,
    unflagTask,
    unvoteTask,
    voteTask,
} from "../controllers/task.js";
import { getMemberProject, getMemberTask, getUser, getUserDetail } from "../controllers/user.js";
import { createTaskHistory } from "../utils/TaskHistory.js";
import { changeStatusName, changeTaskStatusById, createStatus, deleteStatus, getProceedTask, getStatus } from "../controllers/taskstatus.js";
import { createActivity } from "../utils/userActivity.js";
import { createNotification } from "../utils/generateNotif.js";

const router = express.Router();

//router for frontend middleware start
router.get("/get-org-list", checkAuth, getOrgByUserId);
router.get("/workspace-member-role", checkAuth, getMemberRole);
//router for frontend middleware end

router.get("/members", checkAuth, listOrganization);
router.get("/members/detail", checkAuth, getUserDetail);
router.get("/members/task", checkAuth, getMemberTask);
router.get("/members/project", checkAuth, getMemberProject);

router.get("/nonteam-member", checkAuth, nonTeamMember);
router.get("/search-member", checkAuth, searchMember);
router.get("/:org_key", checkAuth, findOrganization);
router.get("/users/user-list", checkAuth, getUser);

router.post("/client", [checkAuth, createActivity], createClient);
router.post("/client/edit", [checkAuth, createActivity], updateClient);
router.delete("/client/:client_key", [checkAuth, createActivity], deleteClient);

router.post("/get-client", checkAuth, getClient);
router.post("/workspace", [checkAuth, createActivity], createWorkspace);
router.post("/workspace/invite-to-workspace", [checkAuth, createActivity], inviteToWorkspace);
router.get("/workspace/list", checkAuth, listWorkspace);
router.get("/workspace/:work_key/members", checkAuth, findMemberWorkspace);
router.get("/workspace/:work_key/workspace", checkAuth, findWorkspace);
router.post("/workspace/kick-member", [checkAuth, createActivity], kickMember);
router.post("/workspace/add-to-team", [checkAuth, createActivity], addMemberToTeam);
router.post("/workspace/delete-workspace", checkAuth, deleteWorkspace);

router.get("/workspace/activity", checkAuth, getWorkspaceActivity);
router.get("/workspace/member-workspace", checkAuth, findMemberByWorkspace);
router.get("/workspace/member-report", checkAuth, workspaceMemberReport);

router.post("/workspace/team", [checkAuth, createActivity], createTeam);
router.post("/workspace/team/edit-name", [checkAuth, createActivity], editTeamName);
router.post("/workspace/team/add-member", checkAuth, addMemberTeam);
router.delete("/workspace/team/:team_key", [checkAuth, createActivity], deleteTeam);

router.post("/workspace/team/team-project", checkAuth, teamProject);

router.get("/workspace/team/get-project", checkAuth, getTeamProject);
router.get("/workspace/team/detail", checkAuth, teamDetail);

router.get("/workspace/team", checkAuth, findAllTeam);
router.get("/workspace/team/get-member", checkAuth, getTeamMember);
router.get("/workspace/team/:team_key/member", checkAuth, findMemberTeam);

router.post("/project", [checkAuth, createActivity], createProject);
router.post("/project/edit-name", [checkAuth, createActivity], editProjectName);
router.get("/project/list", checkAuth, projectList);
router.get("/project/detail", checkAuth, projectDetail);
router.get("/project/handler", checkAuth, getProjectHandler);
router.post("/project/remove-member", [checkAuth, createActivity], removeMember);
router.delete("/project/:project_key", [checkAuth, createActivity], deleteProject);

router.get("/project/search-member", checkAuth, searchMemberProject);
router.get("/project/sprint", checkAuth, getSprint);
router.get("/project/backlog", checkAuth, getBacklog);
router.post("/project/sprint", checkAuth, createSprint);
router.post("/project/sprint/complete", [checkAuth, createActivity], completeSprint);

router.get("/project/user-photo", checkAuth, user_photo);
router.post("/project/user-photo", checkAuth, userPhotoName);

router.post("/project/sprint/start", checkAuth, startSprint);
router.post("/project/edit-sprint", checkAuth, editSprint);
router.post("/project/delete-sprint", [checkAuth, createActivity], deleteSprint);

router.post("/project/invite-member", checkAuth, inviteMember);

router.post("/project/task", [checkAuth, createTaskHistory, createActivity], createTask);
router.post("/project/task/change-sprint", checkAuth, changeSprint);
router.post("/project/task/change-status", checkAuth, changeTaskStatus);
router.post("/project/task/update-desc", [checkAuth, createTaskHistory, createNotification], changeDescTask);
router.post("/project/task/comment", checkAuth, commentTask);
router.post("/project/task/search-task", checkAuth, getTaskByName);
router.post("/project/task/create-issue", [checkAuth, createTaskHistory, createNotification], createIssue);
router.post("/project/task/remove-child", [checkAuth, createTaskHistory, createNotification], removeChild);
router.post("/project/task/upload/attachment", checkAuth, taskAttachment);
router.post("/project/task/attachment/change-name", [checkAuth, createTaskHistory, createNotification], changeNameAttachment);
// router.post("/project/task/comment", checkAuth, changeNameAttachment);
router.post("/project/task/delete-issue", [checkAuth, createTaskHistory, createNotification], deleteIssue);
router.post("/project/task/edit-detail", [checkAuth, createTaskHistory, createNotification], editTaskDetail);
router.post("/project/task/watch", [checkAuth, createTaskHistory, createNotification], addWatch);
router.post("/project/task/stop-watch", [checkAuth, createTaskHistory, createNotification], removeWatch);
router.post("/project/task/vote", [checkAuth, createTaskHistory, createNotification], voteTask);
router.post("/project/task/unvote", [checkAuth, createTaskHistory, createNotification], unvoteTask);
router.post("/project/task/share", checkAuth, shareTask);
router.post("/project/task/flag", [checkAuth, createTaskHistory, createNotification], flagTask);
router.post("/project/task/unflag", [checkAuth, createTaskHistory, createNotification], unflagTask);
router.post("/project/task/edit-parent", [checkAuth, createTaskHistory, createNotification], editParent);
router.post("/project/task/delete-comment", [checkAuth, createTaskHistory, createNotification], deleteComment);
router.post("/project/task/status", checkAuth, createStatus);
router.post("/project/task/status/change-status", checkAuth, changeTaskStatusById);
router.post("/project/task/status/change-name", [checkAuth, createActivity], changeStatusName);
router.post("/project/task/status/delete", [checkAuth, createActivity], deleteStatus);

router.get("/project/task/status", checkAuth, getStatus);
router.get("/project/task/status/task", checkAuth, getProceedTask);
router.get("/project/task/detail", checkAuth, getTaskDetail);
router.get("/project/task/attachment", checkAuth, attachmentByTask);
router.get("/project/task/attach-file", checkAuth, getAttachFile);
router.get("/project/task/history", checkAuth, getCommentHistory);
router.get("/project/task", checkAuth, listTask);
router.get("/project/task/child", checkAuth, getChildTask);
router.get("/project/task/issue", checkAuth, getTaskIssue);
router.get("/project/task/task-status", checkAuth, getTaskStatus);
router.get("/project/task/watch", checkAuth, getWatcher);
router.get("/project/task/vote", checkAuth, getTaskVote);
router.get("/project/task/:task_key/detail", checkAuth, detailTask);
router.delete("/project/task/attachment/:attachId", [checkAuth, createTaskHistory], deletedAttachment);
router.delete("/project/task/:taskKey", checkAuth, deleteTask);

//added by faza

router.get("/workspace/get-member", checkAuth, getMember);

export default router;
