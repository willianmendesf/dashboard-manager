package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.service.AppointmentsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Slf4j
@Controller
@RequestMapping("/appointments")
public class AppointmentsController {

    private final AppointmentsService service;

    private AppointmentsController(AppointmentsService appointmentsService) {
        this.service = appointmentsService;
    }

    @GetMapping
    public Object get() {
        var response = service.run();
        log.info(response.toString());
        return ResponseEntity.ok().body(response);
    }

    @PostMapping
    public Object post() {
        var response = service.run();
        log.info(response.toString());
        return ResponseEntity.ok().body(response);
    }
}
