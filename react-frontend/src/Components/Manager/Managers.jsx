import {
    Button,
    Table,
    TableBody,
    TableContainer,
    TableFooter,
    TableHead,
    TablePagination,
    TableRow
} from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Grid from "@material-ui/core/Grid";
import LinearProgress from "@material-ui/core/LinearProgress";
import * as locales from '@material-ui/core/locale';
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";
import TableCell from "@material-ui/core/TableCell";
import Typography from "@material-ui/core/Typography";
import ThemeProvider from "@material-ui/styles/ThemeProvider";
import {Field, Form, Formik} from "formik";
import {TextField} from "formik-material-ui";
import PropTypes from 'prop-types';
import {default as React, useEffect, useState} from 'react';
import * as yup from "yup";
import AuthenticationService from "../../Services/AuthenticationService";
import {useApi, useModal} from "../Utils/Hooks";
import useStyles from "../Utils/useStyles";
import {useHistory} from "react-router-dom";

const requiredFieldMsg = "Ce champs est requis";
const tooShortError = value => "Doit avoir au moins " + value.min + " caractères";

function DataTableHeader() {
    return <TableRow>
        <TableCell>Nom</TableCell>
        <TableCell>Adresse courriel</TableCell>
        <TableCell>État du compte</TableCell>
        <TableCell>Modifier</TableCell>
    </TableRow>
}

function DataTableBody({rows, setCurrentManager, openEditModal}) {
    const classes = useStyles()

    return rows.map(admin =>
        <TableRow key={admin.id}>
            <TableCell>{admin.name}</TableCell>
            <TableCell>{admin.email}</TableCell>
            <TableCell>{admin.disabled ? "Inactif" : "Actif"}</TableCell>
            <TableCell>
                <Button type={"button"} className={classes.linkButton} onClick={() => {
                    setCurrentManager(admin)
                    openEditModal()
                }}>
                    <i className={"fa fa-pencil-square-o"}/>
                </Button>
            </TableCell>
        </TableRow>
    )
}

DataTableBody.propTypes = {
    rows: PropTypes.array.isRequired,
    setCurrentManager: PropTypes.func.isRequired,
    openEditModal: PropTypes.func.isRequired
}

function DataTable() {
    const api = useApi()
    const [itemCount, setItemCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [currentManager, setCurrentManager] = useState({})
    const [isEditModalOpen, openEditModal, closeEditModal] = useModal()
    const [isCreateModalOpen, openCreateModal, closeCreateModal] = useModal()
    const [rows, setRows] = useState([])

    useEffect(() => {
        api.get("/admins?page=" + currentPage + "&itemsPerPage=" + rowsPerPage)
            .then(response => {
                setRows(response.data.content)
                setItemCount(response.data.totalElements)
            })
    }, [currentPage, rowsPerPage]) // eslint-disable-line react-hooks/exhaustive-deps

    return <ThemeProvider theme={createMuiTheme(locales['frFR'])}>
        <TableContainer>
            <Table>
                <TableHead>
                    <DataTableHeader/>
                </TableHead>
                <TableBody>
                    <DataTableBody rows={rows} setCurrentManager={setCurrentManager} openEditModal={openEditModal}/>
                </TableBody>
                <TableFooter>
                    <tr>
                        <TablePagination
                            component="td"
                            count={itemCount}
                            page={currentPage}
                            onChangePage={(e, page) => setCurrentPage(page)}
                            rowsPerPage={rowsPerPage}
                            onChangeRowsPerPage={({target: {value}}) => setRowsPerPage(parseInt(value))}
                        />
                    </tr>
                </TableFooter>
            </Table>
        </TableContainer>
        <Button onClick={openCreateModal}
                style={{marginLeft: "1em"}}
                type="button"
                variant="contained"
                color="primary"
                size="large"
        >
            Enregistrer un nouveau gestionnaire
        </Button>
        <EditManager manager={currentManager} isOpen={isEditModalOpen} hide={closeEditModal} setRows={setRows}
                     setItemCount={setItemCount}/>
        <CreateManager isOpen={isCreateModalOpen} hide={closeCreateModal} setRows={setRows}
                       setItemCount={setItemCount}/>
    </ThemeProvider>
}

function EditManager({manager, isOpen, hide, setRows, setItemCount}) {
    const api = useApi()
    const classes = useStyles()
    const history = useHistory()

    function toggleManagerDisabledState() {
        return api.put("admins/toggle/" + manager.id, {})
            .then(() => {
                hide()
                return api.get("admins")
                    .then(response => {
                        setRows(response.data.content)
                        setItemCount(response.data.totalElements)
                    })
            })
    }

    return isOpen && <Dialog open={isOpen} onClose={hide}>
        <DialogTitle>{"Modifier gestionnaire de stage : " + manager.name}</DialogTitle>
        <DialogContent>
            <Formik onSubmit={toggleManagerDisabledState} initialValues={{}}>
                {({isSubmitting}) =>
                    <Form>
                        État du compte : {manager.disabled ? "Inactif" : "Actif"}&emsp;
                        <Button type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                disabled={isSubmitting}
                        >
                            {manager.disabled ? "Activer" : "Désactiver"}
                            {isSubmitting && <CircularProgress size={18}/>}
                        </Button>
                    </Form>
                }
            </Formik>
            <br/>
            Changer le mot de passe :
            <Formik
                onSubmit={async values =>
                    api.put("admins/password", values)
                        .then(() => {
                            hide()
                            if (manager.id === AuthenticationService.getCurrentUser().id) {
                                AuthenticationService.logout()
                                history.push("/")
                            }
                        })
                }

                validationSchema={yup.object()
                    .shape({
                        username: yup.string().trim().required(requiredFieldMsg),
                        newPassword: yup.string().trim().min(8, tooShortError).required(requiredFieldMsg),
                        newConfirm: yup.string()
                            .oneOf([yup.ref('newPassword'), null], "Les mots de passes doivent êtres identiques").required(requiredFieldMsg)
                    })}
                validateOnBlur={false}
                validateOnChange={false}
                enableReinitialize={true}
                initialValues={{
                    username: manager.username,
                    newPassword: '',
                    newConfirm: ''
                }}
            >
                {({isSubmitting}) => <Form className={classes.form}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Field
                                component={TextField}
                                name="newPassword"
                                id="newPassword"
                                variant="outlined"
                                label="Nouveau mot de passe"
                                type={"password"}
                                required
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Field
                                component={TextField}
                                name="newConfirm"
                                id="newConfirm"
                                variant="outlined"
                                label="Confirmez"
                                type={"password"}
                                required
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                    <br/>
                    {isSubmitting && <LinearProgress/>}
                    <Button
                        type={"submit"}
                        fullWidth
                        variant="contained"
                        color="primary"
                        size={"large"}
                        className={classes.submit}
                        disabled={isSubmitting}
                    >
                        Changer le mot de passe
                    </Button>
                </Form>}
            </Formik>
        </DialogContent>
        <DialogActions>
            <Button onClick={hide} color="primary">
                Annuler
            </Button>
        </DialogActions>
    </Dialog>;
}

function CreateManager({isOpen, hide, setRows, setItemCount}) {
    const api = useApi()
    const classes = useStyles()

    return isOpen && <Dialog open={isOpen} onClose={hide}>
        <DialogTitle>{"Créer gestionnaire de stage"}</DialogTitle>
        <DialogContent>
            <DialogContentText>
                <Formik
                    onSubmit={async values =>
                        api.post("admins", values)
                            .then(() => {
                                hide()
                                return api.get("admins")
                                    .then(response => {
                                        setRows(response.data.content)
                                        setItemCount(response.data.totalElements)
                                    })
                            })
                    }

                    validationSchema={yup.object()
                        .shape({
                            username: yup.string().trim().required(requiredFieldMsg),
                            name: yup.string().trim().required(requiredFieldMsg),
                            email: yup.string().trim().email("L'email n'a pas un format valide").required(requiredFieldMsg),
                            password: yup.string().trim().min(8, tooShortError).required(requiredFieldMsg),
                            confirm: yup.string().oneOf([yup.ref('password'), null], "Les mots de passes doivent êtres identiques").required(requiredFieldMsg)
                        })}
                    validateOnBlur={false}
                    validateOnChange={false}
                    enableReinitialize={true}
                    initialValues={{
                        username: '',
                        name: '',
                        email: '',
                        password: '',
                        confirm: ''
                    }}
                >
                    {({isSubmitting}) => <Form className={classes.form}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Field
                                    component={TextField}
                                    name="name"
                                    id="name"
                                    variant="outlined"
                                    label="Nom complet"
                                    required
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Field
                                    component={TextField}
                                    name="email"
                                    id="email"
                                    variant="outlined"
                                    label="Adresse courriel"
                                    required
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Field
                                    component={TextField}
                                    name="username"
                                    id="username"
                                    variant="outlined"
                                    label="Nom d'utilisateur"
                                    required
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Field
                                    component={TextField}
                                    name="password"
                                    id="password"
                                    variant="outlined"
                                    label="Nouveau mot de passe"
                                    type={"password"}
                                    required
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Field
                                    component={TextField}
                                    name="confirm"
                                    id="confirm"
                                    variant="outlined"
                                    label="Confirmez"
                                    type={"password"}
                                    required
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                        <br/>
                        {isSubmitting && <LinearProgress/>}
                        <Button
                            type={"submit"}
                            fullWidth
                            variant="contained"
                            color="primary"
                            size={"large"}
                            className={classes.submit}
                            disabled={isSubmitting}
                        >
                            Enregistrer le gestionnaire de stage
                        </Button>
                    </Form>}
                </Formik>
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={hide} color="primary">
                Annuler
            </Button>
        </DialogActions>
    </Dialog>;
}

EditManager.propTypes = {
    manager: PropTypes.object.isRequired,
    isOpen: PropTypes.any.isRequired,
    hide: PropTypes.func.isRequired,
    setRows: PropTypes.func.isRequired,
    setItemCount: PropTypes.func.isRequired
}

CreateManager.propTypes = {
    isOpen: PropTypes.any.isRequired,
    hide: PropTypes.func.isRequired,
    setRows: PropTypes.func.isRequired,
    setItemCount: PropTypes.func.isRequired
}

export default function Managers() {
    const classes = useStyles();

    return <div className={classes.main} style={{overflowY: "auto"}}>
        <Typography variant={"h5"} display={"block"} style={{marginTop: 10}}>
            &ensp;Gestionnaires de stage
        </Typography>
        <DataTable/>
    </div>
}
