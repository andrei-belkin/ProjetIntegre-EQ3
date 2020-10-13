package com.power222.tuimspfcauppbj.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.power222.tuimspfcauppbj.config.TestsWithoutSecurityConfig;
import com.power222.tuimspfcauppbj.controller.StudentApplicationController;
import com.power222.tuimspfcauppbj.model.InternshipOffer;
import com.power222.tuimspfcauppbj.model.Resume;
import com.power222.tuimspfcauppbj.model.Student;
import com.power222.tuimspfcauppbj.model.StudentApplication;
import com.power222.tuimspfcauppbj.service.StudentApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

@ActiveProfiles({"noSecurityTests", "noBootstrappingTests"})
@Import({TestsWithoutSecurityConfig.class})
@WebMvcTest(StudentApplicationController.class)
class StudentApplicationControllerTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private StudentApplicationService svc;

    private StudentApplication expected;

    @BeforeEach
    void beforeEach() {
        expected = StudentApplication.builder()
                .id(1L)
                .offer(new InternshipOffer())
                .student(new Student())
                .resume(new Resume())
                .isHired(false)
                .build();
    }

    @Test
    void createAppliSuccesTest() throws Exception {
        when(svc.createAndSaveNewApplication(anyLong(), anyLong())).thenReturn(Optional.of(expected));

        MvcResult result = mvc.perform(post("/application/1/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}")).andReturn();

        assertEquals(result.getResponse().getStatus(), HttpStatus.CREATED.value());
    }

    @Test
    void createAppliErrorTest() throws Exception {
        when(svc.createAndSaveNewApplication(anyLong(), anyLong())).thenReturn(Optional.empty());

        MvcResult result = mvc.perform(post("/application/1/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}")).andReturn();

        assertEquals(result.getResponse().getStatus(), HttpStatus.BAD_REQUEST.value());
    }

    @Test
    void updateAppliIsHired() throws Exception {

        when(svc.updateStudentApplicationIsHired((expected.getId()))).thenReturn(Optional.of(expected));

        MvcResult result = mvc.perform(put("/application/isHired/" + expected.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(expected))).andReturn();

        assertEquals(result.getResponse().getStatus(), HttpStatus.OK.value());
        verify(svc, times(1)).updateStudentApplicationIsHired(expected.getId());
    }

    @Test
    void updateAppliIsHiredBadId() throws Exception {

        when(svc.updateStudentApplicationIsHired((expected.getId()))).thenReturn(Optional.of(expected));

        MvcResult result = mvc.perform(put("/application/isHired/" + 100)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(expected))).andReturn();

        assertEquals(result.getResponse().getStatus(), HttpStatus.NOT_FOUND.value());
    }
}