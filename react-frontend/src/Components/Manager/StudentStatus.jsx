import {Divider, Typography} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import Grid from "@material-ui/core/Grid";
import * as PropTypes from "prop-types";
import React, {useEffect, useRef, useState} from "react";
import {useApi, useDateParser, useModal} from "../../Services/Hooks";
import OfferDetails from "../Utils/OfferDetails";
import PdfDocument from "../Utils/PDF/PdfDocument";
import useStyles from "../Utils/Style/useStyles";

const applicationAcceptedStates = [
    "STUDENT_HIRED_BY_EMPLOYER",
    "WAITING_FOR_STUDENT_HIRING_FINAL_DECISION",
    "JOB_OFFER_ACCEPTED_BY_STUDENT",
    "JOB_OFFER_DENIED_BY_STUDENT"
]

function ResumeStatus(props) {
    function getResumeState(resume) {
        if (resume.reviewState === "PENDING")
            return <span style={{color: "blue"}}>En attente</span>
        else if (resume.reviewState === "DENIED")
            return <span style={{color: "red"}}>Rejeté<span
                style={{color: "black"}}> : {resume.reasonForRejection} </span></span>
        else
            return <span style={{color: "green"}}>Approuvé</span>
    }

    return <div>
        <Typography variant={"h5"}>
            {props.resume.name}
        </Typography>
        <Typography>
            État : {getResumeState(props.resume)}
            &emsp;
            <Button
                variant={"contained"}
                color={"primary"}
                size={"small"}
                onClick={props.onClick}>
                <i className="fa fa-file-text-o"/>&ensp;Afficher le CV
            </Button>
        </Typography>
        <Divider/>
    </div>
}

ResumeStatus.propTypes = {
    classes: PropTypes.any,
    onClick: PropTypes.func,
    resume: PropTypes.any
}

function OfferStatus(props) {
    const parseInterviewDate = useDateParser()
    const application = props.offer.applications.find(a => a.student.id === props.currentStudent.id)

    function parseInterviewState(interview) {
        if (interview.studentAcceptanceState === "INTERVIEW_ACCEPTED_BY_STUDENT")
            return "acceptée par l'étudiant"
        else if (interview.studentAcceptanceState === "INTERVIEW_REJECTED_BY_STUDENT")
            return "refusée par l'étudiant. Raison : " + interview.reasonForRejectionByStudent
        else
            return "en attente de réponse de l'étudiant"
    }

    function parseApplicationState(application) {
        if (application.state === "JOB_OFFER_ACCEPTED_BY_STUDENT")
            return "Acceptée par l'étudiant"
        else if (application.state === "JOB_OFFER_DENIED_BY_STUDENT")
            return "Refusée par l'étudiant. Raison : " + application.reasonForRejection
        else
            return "En attente de réponse de l'étudiant"
    }

    return <div>
        <Typography variant={"h5"}>
            {props.offer.title}
        </Typography>
        <OfferDetails offer={props.offer}/>
        <Typography
            variant={"body2"}>
            A appliqué : {application ? "Oui" : "Non"} &emsp;
            {application && <span>
            {
                application.interview ?
                    <span>
                   Entrevue : {parseInterviewDate(application.interview.dateTime)}, {parseInterviewState(application.interview)}
                </span>
                    :
                    <span>
                   Entrevue  Pas planifiée
                </span>
            }
                <br/>
                &emsp;A été sélectionné : {applicationAcceptedStates.indexOf(application.state) > -1 ? "Oui" : "Non"}
                &emsp;Offre : {parseApplicationState(application)}
                </span>
            }&emsp;
            <Button variant={"contained"}
                    color={"primary"}
                    size={"small"}
                    onClick={props.onClick}>
                <i className="fa fa-file-text-o"/>&ensp;Afficher l'offre
            </Button>
        </Typography>
        <Divider/>
    </div>
}

OfferStatus.propTypes = {
    classes: PropTypes.any,
    onClick: PropTypes.func,
    offer: PropTypes.any,
    currentStudent: PropTypes.any,
}

function StudentApplicationDetails({student}) {

    function interviewStatus() {
        const interviewCount = student.applications.filter(appli => appli.interview).length

        if (interviewCount > 0)
            return interviewCount + " demandes d'entrevue"
        else
            return "Aucune demande d'entrevue"
    }

    function isApplicationPending(appli) {
        return appli.state === "APPLICATION_PENDING_FOR_EMPLOYER_INITIAL_REVIEW" ||
            appli.state === "WAITING_FOR_EMPLOYER_HIRING_FINAL_DECISION" ||
            appli.state === "WAITING_FOR_STUDENT_HIRING_FINAL_DECISION"
    }

    function applicationStatus() {
        const acceptedApplication = student.applications.find(appli => appli.state === "JOB_OFFER_ACCEPTED_BY_STUDENT")
        if (acceptedApplication)
            return "A accepté l'offre " + acceptedApplication.offer.title + " de "
                + acceptedApplication.offer.employer.companyName

        let pendingApplications = student.applications.filter(isApplicationPending).length
        return pendingApplications + " en attente de décision"
    }

    function contractStatus() {
        for (const appli of student.applications)
            if (appli.contract)
                switch (appli.contract.signatureState) {
                    case "PENDING_FOR_ADMIN_REVIEW":
                        return "Contrat en attente de l'approbation du gestionnaire de stage"
                    case "WAITING_FOR_EMPLOYER_SIGNATURE" :
                        return "Contrat en attente de la signature de l'employeur"
                    case "REJECTED_BY_EMPLOYER" :
                        return "L'employeur a rejeté le contrat"
                    case "WAITING_FOR_STUDENT_SIGNATURE" :
                        return "Contrat en attente de la signature de l'étudiant"
                    case "WAITING_FOR_ADMIN_SIGNATURE":
                        return "Contrat en attente de la signature du gestionnaire de stage"
                    case "SIGNED":
                    default:
                        return "Contrat signé par tous les parties"
                }
        return null
    }

    return student.applications.length > 0 ? <>
            <Typography>
                {interviewStatus()}
            </Typography>
            <Typography>
                {applicationStatus()}
            </Typography>
            <Typography>
                {contractStatus()}
            </Typography>
        </>
        : <Typography>
            N'a appliqué sur aucune offre
        </Typography>
}

StudentApplicationDetails.propTypes = {
    student: PropTypes.object.isRequired
}

function StudentStatusDetails({student}) {

    function resumeStatus() {
        if (student.resumes.length === 0)
            return "Aucun CV"
        else {
            let approvedResumes = 0
            let pendingResumes = 0
            let rejectedResumes = 0

            for (const resume of student.resumes) {
                if (resume.reviewState === "APPROVED")
                    approvedResumes++
                else if (resume.reviewState === "PENDING")
                    pendingResumes++
                else if (resume.reviewState === "DENIED")
                    rejectedResumes++
            }

            return student.resumes.length + " CVs : " + approvedResumes + " approuvés, "
                + pendingResumes + " en attente, " + rejectedResumes + " rejetés "
        }
    }

    function offerStatus() {
        if (student.allowedOffers.length === 0)
            return "N'a accès à aucune offre"
        else
            return "A accès à " + student.allowedOffers.length + " offres, a déposé "
                + student.applications.length + " applications"
    }

    return <>
        <Typography>
            {resumeStatus()}
        </Typography>
        <Typography>
            {offerStatus()}
        </Typography>
        {student.allowedOffers && student.allowedOffers.length > 0 &&
        <StudentApplicationDetails student={student}/>
        }
    </>
}

StudentStatusDetails.propTypes = {
    student: PropTypes.object.isRequired
}

export default function StudentStatus() {
    const classes = useStyles()
    const api = useApi()
    const [students, setStudents] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [currentSubtab, setCurrentSubtab] = useState(0)
    const [currentDoc, setCurrentDoc] = useState("")
    const [isPdfOpen, openPdf, closePdf] = useModal()
    const pdfContainer = useRef()

    useEffect(() => {
        api.get("students").then(resp => setStudents(resp ? resp.data : []))
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    function isResumesNotUndefined(students, currentIndex) {
        return students.length !== 0 && students[currentIndex].resumes.length > 0
    }

    function isOffersNotUndefined(students, currentIndex) {
        return students[currentIndex].allowedOffers && students[currentIndex].allowedOffers.length > 0
    }

    return <Grid
        container
        spacing={2}
        className={classes.main}
        style={{padding: "15px 0 0 15px"}}
    >
        <Grid item xs={5} className={classes.list}>
            <Typography variant={"h4"} gutterBottom={true} className={classes.title}>
                État des étudiants
            </Typography>
            {students.length !== 0 ? students.map((item, i) =>
                <div key={i}>
                    <Button
                        variant={"contained"}
                        color={"primary"}
                        style={{textTransform: "none", marginBottom: 10}}
                        onClick={() => {
                            setCurrentIndex(i)
                        }}>
                        <Typography variant={"body1"} display={"block"} align={"left"}>
                            {students[i].firstName} {students[i].lastName}
                        </Typography>
                    </Button>
                    {currentIndex === i && <div>
                        <StudentStatusDetails student={students[i]}/>
                        <Button
                            variant={currentSubtab === 0 ? "contained" : "outlined"}
                            color={"primary"}
                            style={{textTransform: "none"}}
                            onClick={() => setCurrentSubtab(0)}>
                            <Typography variant={"body2"}>
                                CVs
                            </Typography>
                        </Button>
                        &ensp;
                        <Button
                            variant={currentSubtab === 1 ? "contained" : "outlined"}
                            color={"primary"}
                            style={{textTransform: "none"}}
                            onClick={() => setCurrentSubtab(1)}>
                            <Typography variant={"body2"}>
                                Offres de stage
                            </Typography>
                        </Button>
                    </div>}
                    <Divider className={classes.dividers}/>
                </div>
            ) : "Aucun étudiant"}
        </Grid>
        <Grid item xs={7} align={"center"} style={{overflow: "auto", height: "100%"}}>
            {students.length !== 0 &&
            <div>
                {currentSubtab === 0 && (isResumesNotUndefined(students, currentIndex) ? students[currentIndex].resumes.map((resume, index) =>
                    <ResumeStatus key={index}
                                  classes={classes}
                                  resume={resume}
                                  onClick={() => {
                                      setCurrentDoc(resume.file)
                                      openPdf()
                                  }}/>
                ) : "L'étudiant n'a téléversé aucun CV")}
                {currentSubtab === 1 && (isOffersNotUndefined(students, currentIndex) ? students[currentIndex].allowedOffers.map((offer, index) =>
                    <OfferStatus key={index}
                                 classes={classes}
                                 offer={offer}
                                 currentStudent={students[currentIndex]}
                                 onClick={() => {
                                     setCurrentDoc(offer.file)
                                     openPdf()
                                 }}/>
                ) : " L'étudiant n'a accès à aucune offre de stage")}
            </div>}
        </Grid>
        <Dialog open={isPdfOpen} onClose={closePdf} maxWidth={"xl"}>
            <DialogContent className={classes.viewbox} ref={pdfContainer}>
                <PdfDocument document={currentDoc} container={pdfContainer}/>
            </DialogContent>
            <DialogActions>
                <Button onClick={closePdf} color="primary">
                    Fermer
                </Button>
            </DialogActions>
        </Dialog>
    </Grid>
}